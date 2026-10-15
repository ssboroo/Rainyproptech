import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
test("Postgres migration: atomic charge, retry, insufficient balance, refund exactly once and access grants", async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon; create role authenticated; create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text);create function storage.foldername(text) returns text[] language sql as 'select string_to_array($1,''/'')';`,
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  }
  const user = "11111111-1111-4111-8111-111111111111",
    id = "22222222-2222-4222-8222-222222222222",
    second = "33333333-3333-4333-8333-333333333333";
  await db.query("insert into auth.users values($1)", [user]);
  await db.query("insert into public.profiles values($1,8)", [user]);
  const reserve = (i: string, kind = "image") =>
    db.query(
      `select * from public.reserve_generation($1,$2,$3,'exterior','villa','modern_glass','facade_pan','prompt','source',null,'model')`,
      [i, user, kind],
    );
  const balance = async () =>
    Number(
      (
        await db.query<{ credits: number }>(
          "select credits from public.profiles",
        )
      ).rows[0].credits,
    );
  await reserve(id);
  assert.equal(await balance(), 6);
  await reserve(id);
  assert.equal(await balance(), 6);
  await reserve(second, "video");
  assert.equal(await balance(), 0);
  await assert.rejects(
    reserve("44444444-4444-4444-8444-444444444444"),
    /Insufficient credits/,
  );
  assert.equal(await balance(), 0);
  await db.query("select public.fail_generation($1,$2)", [second, user]);
  assert.equal(await balance(), 6);
  await db.query("select public.fail_generation($1,$2)", [second, user]);
  assert.equal(await balance(), 6);
  await db.query(
    "update public.generations set status='completed' where id=$1",
    [id],
  );
  await db.query("select public.fail_generation($1,$2)", [id, user]);
  assert.equal(await balance(), 6);
  const grants = await db.query<{ allowed: boolean }>(
    `select has_function_privilege('authenticated','public.fail_generation(uuid,uuid)','execute') as allowed`,
  );
  assert.equal(grants.rows[0].allowed, false);
  const rls = await db.query<{ relrowsecurity: boolean }>(
    "select relrowsecurity from pg_class where relname in ('profiles','generations')",
  );
  assert.ok(rls.rows.every((r) => r.relrowsecurity));
  await db.close();
});
