import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111";
const author = "22222222-2222-4222-8222-222222222222";
const other = "33333333-3333-4333-8333-333333333333";
const outsider = "44444444-4444-4444-8444-444444444444";
let trip, activity;
async function actor(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
}
async function edit({
  version = 1,
  title = "Museu atualizado",
  day = "2026-12-11",
  time = "15:00",
  location = "",
  cost = 30,
} = {}) {
  return db.query("select public.update_activity($1,$2,$3,$4,$5,$6,$7)", [
    activity,
    version,
    title,
    day,
    time,
    location,
    cost,
  ]);
}
async function current() {
  return (await db.query("select * from public.activities where id=$1", [activity])).rows[0];
}
async function votes() {
  return (await db.query("select * from public.activity_votes where activity_id=$1", [activity]))
    .rows;
}
before(async () => {
  await db.exec(`
    create role authenticated nologin;
    create role anon nologin;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  for (const id of [owner, author, other, outsider])
    await db.query("insert into auth.users(id) values ($1)", [id]);
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory)).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(file, directory), "utf8"));
  }
});
beforeEach(async () => {
  await db.exec("reset role; truncate public.trips cascade");
  await actor(owner);
  trip = (
    await db.query(
      "insert into public.trips(owner_id,name,destination,start_date,end_date) values ($1,'Viagem teste','Curitiba','2026-12-10','2026-12-12') returning id",
      [owner],
    )
  ).rows[0].id;
  const token = (
    await db.query("insert into public.trip_invites(trip_id) values ($1) returning token", [trip])
  ).rows[0].token;
  for (const id of [other, author]) {
    await actor(id);
    await db.query("select public.accept_trip_invite($1)", [token]);
  }
  activity = (
    await db.query(
      "insert into public.activities(trip_id,created_by,title,day,start_time,estimated_cost) values ($1,$2,'Museu original','2026-12-11','14:00',20) returning id",
      [trip, author],
    )
  ).rows[0].id;
  await db.query("insert into public.activity_votes values ($1,$2)", [activity, author]);
});
after(() => db.close());

test("author edits own suggestion atomically, preserving identity and clearing votes", async () => {
  const original = await current();
  await edit();
  const updated = await current();
  assert.equal(updated.title, "Museu atualizado");
  assert.equal(updated.version, 2);
  assert.equal(updated.created_by, author);
  assert.deepEqual(updated.created_at, original.created_at);
  assert.equal(updated.trip_id, trip);
  assert.deepEqual(await votes(), []);
});
test("owner editing a confirmed activity reopens it; no-op preserves status and votes", async () => {
  await actor(owner);
  await db.query("update public.activities set status='confirmed' where id=$1", [activity]);
  await edit({ version: 2, title: "  Museu original  ", time: "14:00", cost: 20 });
  assert.equal((await current()).version, 2);
  assert.equal((await current()).status, "confirmed");
  assert.equal((await votes()).length, 1);
  await edit({ version: 2 });
  assert.equal((await current()).status, "proposed");
  assert.equal((await current()).version, 3);
  assert.deepEqual(await votes(), []);
});
test("other members, outsiders, removed authors and anonymous callers cannot edit", async () => {
  await actor(other);
  await assert.rejects(edit(), { code: "42501" });
  await actor(outsider);
  await assert.rejects(edit(), { code: "P0002" });
  await actor(owner);
  await db.query("delete from public.trip_members where trip_id=$1 and user_id=$2", [trip, author]);
  await actor(author);
  await assert.rejects(edit(), { code: "P0002" });
  await db.exec("reset role; set role anon");
  await assert.rejects(edit(), { code: "42501" });
});
test("author cannot edit confirmed activity or confirm directly", async () => {
  assert.equal(
    (
      await db.query("update public.activities set status='confirmed' where id=$1 returning id", [
        activity,
      ])
    ).rows.length,
    0,
  );
  await actor(owner);
  await db.query("update public.activities set status='confirmed' where id=$1", [activity]);
  await actor(author);
  await assert.rejects(edit({ version: 2 }), { code: "42501" });
  await assert.rejects(edit(), { code: "40001" });
});
test("invalid data rolls back content, version and votes", async () => {
  for (const input of [
    { day: "2026-12-20" },
    { title: "x" },
    { cost: -1 },
    { cost: 1.001 },
    { time: "24:00" },
    { location: "x".repeat(201) },
  ]) {
    await assert.rejects(edit(input));
    assert.equal((await current()).version, 1);
    assert.equal((await current()).title, "Museu original");
    assert.equal((await votes()).length, 1);
  }
});
test("retry with stale version cannot erase votes cast after the first save", async () => {
  await edit({ time: null, location: "", cost: 0 });
  await db.query("insert into public.activity_votes values ($1,$2)", [activity, author]);
  await assert.rejects(edit(), { code: "40001" });
  assert.equal((await votes()).length, 1);
  assert.equal((await current()).start_time, null);
  assert.equal(Number((await current()).estimated_cost), 0);
});
test("direct writes cannot bypass transaction or forge protected fields", async () => {
  await actor(owner);
  for (const assignment of [
    "title='Outro passeio'",
    "version=9",
    "created_by='" + other + "'",
    "trip_id='" + outsider + "'",
    "created_at=now()",
    "id='" + outsider + "'",
  ]) {
    await assert.rejects(
      db.query("update public.activities set " + assignment + " where id=$1", [activity]),
      { code: "42501" },
    );
  }
  await assert.rejects(
    db.query(
      "insert into public.activities(trip_id,created_by,title,day,version) values ($1,$2,'Fraude','2026-12-11',9)",
      [trip, owner],
    ),
    { code: "42501" },
  );
});
test("owner can edit departed author's suggestion; deleted activities are not recreated", async () => {
  await actor(owner);
  await db.query("delete from public.trip_members where trip_id=$1 and user_id=$2", [trip, author]);
  await edit();
  assert.equal((await current()).created_by, author);
  await db.query("delete from public.activities where id=$1", [activity]);
  await assert.rejects(edit({ version: 2 }), { code: "P0002" });
});
