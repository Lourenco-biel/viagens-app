import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";

const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111";
const guest = "22222222-2222-4222-8222-222222222222";
const outsider = "33333333-3333-4333-8333-333333333333";
let trip, otherTrip, beforeMigration;
async function actor(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
}
async function snapshot() {
  const result = {};
  for (const table of ["trips", "trip_members", "trip_invites", "activities", "activity_votes"]) {
    result[table] = (
      await db.query(
        `select to_jsonb(t) - 'budget_per_person' as row from public.${table} t order by to_jsonb(t)::text`,
      )
    ).rows;
  }
  return result;
}
async function budget() {
  return (
    await db.query("select budget_per_person::text as value from public.trips where id=$1", [trip])
  ).rows[0]?.value;
}
async function set(value) {
  return db.query("update public.trips set budget_per_person=$1 where id=$2 returning id", [
    value,
    trip,
  ]);
}
before(async () => {
  await db.exec(`create role authenticated nologin; create role anon nologin;
    create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;`);
  for (const id of [owner, guest, outsider])
    await db.query("insert into auth.users(id) values ($1)", [id]);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  const files = (await readdir(directory)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files.filter((f) => f < "202611060001"))
    await db.exec(await readFile(new URL(file, directory), "utf8"));
  await actor(owner);
  for (let i = 0; i < 2; i++) {
    const id = (
      await db.query(
        "insert into public.trips(owner_id,name,destination,start_date,end_date) values ($1,'Viagem','Curitiba','2026-12-10','2026-12-12') returning id",
        [owner],
      )
    ).rows[0].id;
    if (i === 0) trip = id;
    else otherTrip = id;
  }
  const token = (
    await db.query("insert into public.trip_invites(trip_id) values ($1) returning token", [trip])
  ).rows[0].token;
  await actor(guest);
  await db.query("select public.accept_trip_invite($1)", [token]);
  const activity = (
    await db.query(
      "insert into public.activities(trip_id,created_by,title,day,estimated_cost) values ($1,$2,'Museu','2026-12-11',320) returning id",
      [trip, guest],
    )
  ).rows[0].id;
  await db.query("insert into public.activity_votes values ($1,$2)", [activity, guest]);
  await actor(owner);
  await db.query("update public.activities set status='confirmed' where id=$1", [activity]);
  beforeMigration = await snapshot();
  await db.exec("reset role");
  for (const file of files.filter((f) => f >= "202611060001"))
    await db.exec(await readFile(new URL(file, directory), "utf8"));
  await actor(owner);
});
after(() => db.close());
test("migração preserva todos os registros e inicia sem orçamento", async () => {
  assert.equal(await budget(), null);
  assert.deepEqual(await snapshot(), beforeMigration);
  const inserted = await db.query(
    "insert into public.trips(owner_id,name,destination,start_date,end_date) values ($1,'Nova','Recife','2026-12-10','2026-12-12') returning budget_per_person",
    [owner],
  );
  assert.equal(inserted.rows[0].budget_per_person, null);
});
test("aceita zero e decimal grande exato; rejeita precisão e valores especiais", async () => {
  for (const value of ["0", "500.50", "9007199254740993.01"]) {
    await set(value);
    assert.equal(await budget(), value);
  }
  for (const value of ["-1", "1.001", "1.230", "NaN", "Infinity", "-Infinity"]) {
    await assert.rejects(set(value), { code: "23514" });
    assert.equal(await budget(), "9007199254740993.01");
  }
  await set(null);
});
test("gestão idempotente preserva roteiro, votos, membros, convites e outra viagem", async () => {
  const original = await snapshot();
  for (const value of ["500.00", "500.00", "600.50", "0", null, null]) {
    assert.equal((await set(value)).rows.length, 1);
    assert.equal(await budget(), value);
    assert.deepEqual(await snapshot(), original);
    assert.equal(
      (await db.query("select budget_per_person from public.trips where id=$1", [otherTrip]))
        .rows[0].budget_per_person,
      null,
    );
  }
  await set("500.00");
  await db.query("update public.trips set name='Renomeada', end_date='2026-12-13' where id=$1", [
    trip,
  ]);
  assert.equal(await budget(), "500.00");
  await assert.rejects(
    db.query("update public.trips set end_date='2026-12-10' where id=$1", [trip]),
    { code: "23514" },
  );
});
test("RLS impede escrita de participante, externo e membro removido; anônimo sem acesso", async () => {
  await actor(guest);
  assert.equal(await budget(), "500.00");
  for (const value of ["0", "600", null]) assert.equal((await set(value)).rows.length, 0);
  await actor(outsider);
  assert.equal(await budget(), undefined);
  assert.equal((await set("700")).rows.length, 0);
  await actor(owner);
  await db.query("delete from public.trip_members where trip_id=$1 and user_id=$2", [trip, guest]);
  await actor(guest);
  assert.equal(await budget(), undefined);
  assert.equal((await set(null)).rows.length, 0);
  await db.exec("reset role; set role anon");
  await assert.rejects(budget(), { code: "42501" });
  await assert.rejects(set("10"), { code: "42501" });
  await actor(owner);
  assert.equal(await budget(), "500.00");
});
