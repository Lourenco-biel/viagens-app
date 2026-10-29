import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { before, after, test } from "node:test";
import assert from "node:assert/strict";

const db = new PGlite();
const owner = "11111111-1111-4111-8111-111111111111";
const guest = "22222222-2222-4222-8222-222222222222";
const outsider = "33333333-3333-4333-8333-333333333333";
let tripId, activityId, token;

async function actor(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec("set role authenticated");
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
  for (const id of [owner, guest, outsider]) {
    await db.query("insert into auth.users(id, raw_user_meta_data) values ($1, $2)", [
      id,
      { name: "Viajante" },
    ]);
  }
  const directory = new URL("../supabase/migrations/", import.meta.url);
  for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(new URL(file, directory), "utf8"));
  }
});
after(async () => {
  await db.close();
});

test("owner creation is atomic and other accounts cannot read or forge ownership", async () => {
  await actor(owner);
  const created = await db.query(
    "insert into public.trips(owner_id,name,destination,start_date,end_date) values ($1,'Viagem teste','Curitiba','2026-12-10','2026-12-12') returning id",
    [owner],
  );
  tripId = created.rows[0].id;
  assert.equal((await db.query("select * from public.trip_members")).rows.length, 1);
  await actor(outsider);
  assert.equal((await db.query("select * from public.trips")).rows.length, 0);
  assert.equal((await db.query("select * from public.trip_members")).rows.length, 0);
  await assert.rejects(
    db.query(
      "insert into public.trips(owner_id,name,destination,start_date,end_date) values ($1,'Fraude','Curitiba','2026-12-10','2026-12-12')",
      [owner],
    ),
  );
});

test("only valid invites create membership, and acceptance is idempotent", async () => {
  await actor(owner);
  const invitation = await db.query(
    "insert into public.trip_invites(trip_id) values ($1) returning token",
    [tripId],
  );
  token = invitation.rows[0].token;
  await actor(guest);
  assert.equal((await db.query("select * from public.trip_invites")).rows.length, 0);
  await assert.rejects(db.query("select public.accept_trip_invite($1)", [outsider]));
  await db.query("select public.accept_trip_invite($1)", [token]);
  await db.query("select public.accept_trip_invite($1)", [token]);
  assert.equal((await db.query("select * from public.trip_members")).rows.length, 2);
  const changed = await db.query(
    "update public.trips set name='Alteração indevida' where id=$1 returning id",
    [tripId],
  );
  assert.equal(changed.rows.length, 0);
});

test("members propose within the trip period and outsiders cannot read the itinerary", async () => {
  await actor(guest);
  await assert.rejects(
    db.query(
      "insert into public.activities(trip_id,created_by,title,day) values ($1,$2,'Fora do período','2026-12-20')",
      [tripId, guest],
    ),
  );
  const created = await db.query(
    "insert into public.activities(trip_id,created_by,title,day) values ($1,$2,'Jardim Botânico','2026-12-11') returning id",
    [tripId, guest],
  );
  activityId = created.rows[0].id;
  await actor(outsider);
  assert.equal((await db.query("select * from public.activities")).rows.length, 0);
  await assert.rejects(
    db.query("insert into public.activity_votes values ($1,$2)", [activityId, outsider]),
  );
});

test("votes are unique and organizer confirmation closes voting", async () => {
  await actor(guest);
  await db.query("insert into public.activity_votes values ($1,$2)", [activityId, guest]);
  await assert.rejects(
    db.query("insert into public.activity_votes values ($1,$2)", [activityId, guest]),
  );
  assert.equal(
    (
      await db.query("update public.activities set status='confirmed' where id=$1 returning id", [
        activityId,
      ])
    ).rows.length,
    0,
  );
  await actor(owner);
  await db.query("update public.activities set status='confirmed' where id=$1", [activityId]);
  await assert.rejects(
    db.query("insert into public.activity_votes values ($1,$2)", [activityId, owner]),
  );
  await actor(guest);
  assert.equal(
    (
      await db.query("delete from public.activity_votes where activity_id=$1 returning *", [
        activityId,
      ])
    ).rows.length,
    0,
  );
});

test("trip dates cannot invalidate existing activities and organizer cannot leave", async () => {
  await actor(owner);
  await assert.rejects(
    db.query("update public.trips set end_date='2026-12-10' where id=$1", [tripId]),
  );
  assert.equal(
    (
      await db.query(
        "delete from public.trip_members where trip_id=$1 and user_id=$2 returning *",
        [tripId, owner],
      )
    ).rows.length,
    0,
  );
});

test("removing a member revokes access and removes their votes", async () => {
  await actor(owner);
  await db.query("delete from public.trip_members where trip_id=$1 and user_id=$2", [
    tripId,
    guest,
  ]);
  assert.equal((await db.query("select * from public.activity_votes")).rows.length, 0);
  await actor(guest);
  assert.equal((await db.query("select * from public.trips")).rows.length, 0);
});

test("expired invites cannot be accepted", async () => {
  await actor(owner);
  await db.query(
    "update public.trip_invites set expires_at=now()-interval '1 second' where trip_id=$1",
    [tripId],
  );
  await actor(guest);
  await assert.rejects(db.query("select public.accept_trip_invite($1)", [token]));
});
