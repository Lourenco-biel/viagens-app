import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";

const exec = promisify(execFile);
const url = process.env.DATABASE_TEST_URL;
if (
  !url ||
  new URL(url).pathname !== "/viagens_activity_test" ||
  !["localhost", "127.0.0.1"].includes(new URL(url).hostname)
) {
  throw new Error("Use DATABASE_TEST_URL com um banco local vazio chamado viagens_activity_test.");
}
const psql = process.env.PSQL_PATH || "psql";
const args = [url, "-X", "-qAt", "-v", "ON_ERROR_STOP=1"];
const sql = async (query) => (await exec(psql, [...args, "-c", query])).stdout.trim();
const owner = "11111111-1111-4111-8111-111111111111";
const author = "22222222-2222-4222-8222-222222222222";
const trip = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const activity = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const as = (id) =>
  "set role authenticated; select set_config('request.jwt.claim.sub','" + id + "',false);";
const edit = (version, title) =>
  "select public.update_activity('" +
  activity +
  "'," +
  version +
  ",'" +
  title +
  "','2026-12-11',null,'',20);";
const vote = "insert into public.activity_votes values ('" + activity + "','" + author + "');";

assert.equal(
  await sql(
    "select count(*) from information_schema.tables where table_schema in ('public','auth')",
  ),
  "0",
  "O banco de teste deve estar vazio.",
);
await sql(`
  do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
  do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
  create schema auth;
  create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  insert into auth.users(id) values ('${owner}'), ('${author}');
`);
const directory = new URL("../supabase/migrations/", import.meta.url);
for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
  await sql(await readFile(new URL(file, directory), "utf8"));
}
await sql(
  as(owner) +
    `
  insert into public.trips(id,owner_id,name,destination,start_date,end_date)
    values ('${trip}','${owner}','Teste concorrente','Curitiba','2026-12-10','2026-12-12');
  insert into public.trip_invites(trip_id,token) values ('${trip}','${trip}');
`,
);
await sql(
  as(author) +
    `
  select public.accept_trip_invite('${trip}');
  insert into public.activities(trip_id,created_by,title,day)
    values ('${trip}','${author}','Museu','2026-12-11');
`,
);
const actualActivity = await sql("select id from public.activities where trip_id='" + trip + "'");
const replaceId = (query) => query.replaceAll(activity, actualActivity);

async function race(first, second, { rejects = false } = {}) {
  const connection = spawn(psql, args, { stdio: ["pipe", "pipe", "pipe"] });
  let errors = "";
  connection.stderr.on("data", (chunk) => {
    errors += chunk;
  });
  const ended = new Promise((resolve, reject) => {
    connection.on("error", reject);
    connection.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(errors))));
  });
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("A transação não abriu: " + errors)), 10000);
    connection.stdout.on("data", (chunk) => {
      if (String(chunk).includes("LOCK_READY")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  connection.stdin.write("begin; " + replaceId(first) + "\n\\echo LOCK_READY\n");
  let result;
  try {
    await ready;
    const waiting = sql(
      "set application_name='viagens_concurrency_waiter'; " + replaceId(second),
    ).then(
      (value) => ({ value }),
      (error) => ({ error }),
    );
    let blocked = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      blocked =
        (await sql(
          "select count(*) from pg_stat_activity where application_name='viagens_concurrency_waiter' and wait_event_type='Lock'",
        )) !== "0";
      if (blocked) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    connection.stdin.end("commit;\n");
    result = await waiting;
    await ended;
    assert.equal(blocked, true, "A segunda conexão deve aguardar o lock da primeira.");
    if (rejects) assert.match(result.error?.stderr ?? "", /Carregue a versão atual/);
    else if (result.error) throw result.error;
  } finally {
    if (connection.exitCode === null) {
      connection.stdin.end("rollback;\n");
      await ended;
    }
  }
}

await race(as(author) + vote, as(author) + edit(1, "Museu alterado"));
assert.equal(await sql("select count(*) from public.activity_votes"), "0");
console.log("PASS: voto anterior ao commit da edição é removido.");

await race(as(author) + edit(2, "Museu novo"), as(author) + vote);
assert.equal(await sql("select count(*) from public.activity_votes"), "1");
console.log("PASS: voto posterior ao commit da edição é preservado.");

await race(as(owner) + edit(3, "Museu final"), as(author) + edit(3, "Não sobrescrever"), {
  rejects: true,
});
assert.equal(await sql("select title from public.activities"), "Museu final");
console.log("PASS: duas edições não sobrescrevem a mesma versão.");

await race(
  as(owner) + "update public.activities set status='confirmed' where id='" + activity + "';",
  as(author) + edit(4, "Não alterar confirmado"),
  { rejects: true },
);
assert.equal(await sql("select status from public.activities"), "confirmed");
console.log("PASS: confirmação concorrente invalida o formulário antigo.");
