import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  verifyWireSignature,
  paymentMatches,
  trustedCheckout,
} from "../lib/wire";
import { publicQuote } from "../lib/public-pricing";
import { quoteFor, pricingPolicy } from "../lib/pricing";
import { catalog, buildModelInput } from "../lib/model-router";
import { isPlatformAdmin, encryptSecret, decryptSecret } from "../lib/settings";
import { configuredModel } from "../lib/configured-model";
import { defaultSettings } from "../lib/settings-schema";
test("retail serialization exposes only the marked-up customer amount", () => {
  const m = catalog[0],
    q = quoteFor(
      m,
      buildModelInput(m, "https://example.com/a.png", "Architecture"),
      Date.parse("2026-10-15"),
    );
  const retail = publicQuote(q);
  assert.equal(retail.totalMnt, 3800);
  assert.equal(retail.credits, 38);
  assert.equal("apiUsd" in retail, false);
  assert.equal("markup" in retail, false);
  assert.equal("usdMnt" in retail, false);
  const p = { ...pricingPolicy, usdMnt: 4000, version: "review-2" };
  assert.equal(
    quoteFor(
      m,
      buildModelInput(m, "https://example.com/a.png", "Architecture"),
      Date.parse("2026-10-15"),
      p,
    ).version,
    "review-2",
  );
});
test("admin authorization rejects editable metadata and unverified emails; secret storage is authenticated encryption", () => {
  const before = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "owner@example.com";
  assert.equal(isPlatformAdmin({ email: "owner@example.com" }), false);
  assert.equal(
    isPlatformAdmin({
      email: "other@example.com",
      email_confirmed_at: "now",
      app_metadata: {},
    }),
    false,
  );
  assert.equal(
    isPlatformAdmin({ email: "OWNER@example.com", email_confirmed_at: "now" }),
    true,
  );
  if (before === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = before;
  const old = process.env.SETTINGS_ENCRYPTION_KEY;
  process.env.SETTINGS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  const c = encryptSecret("test-value");
  assert.equal(decryptSecret(c), "test-value");
  assert.ok(!c.includes("test-value"));
  const bits = c.split(".");
  bits[1] = Buffer.alloc(16).toString("base64");
  assert.throws(() => decryptSecret(bits.join(".")));
  if (old === undefined) delete process.env.SETTINGS_ENCRYPTION_KEY;
  else process.env.SETTINGS_ENCRYPTION_KEY = old;
});
test("configured disabled models cannot be submitted and admin defaults remain project-aware", () => {
  assert.throws(
    () =>
      configuredModel(
        { ...defaultSettings, disabledModels: [defaultSettings.defaultImage] },
        "image",
        "exterior_facade",
        "facade_pan",
        "auto",
      ),
    /түр хаалттай/,
  );
  assert.equal(
    configuredModel(
      defaultSettings,
      "video",
      "master_plan",
      "drone_orbit",
      "auto",
    ).model.kind,
    "video",
  );
});
test("Wire rejects tampering, stale deliveries, wrong amounts and unsafe checkout destinations", () => {
  const now = 1792058400000,
    t = String(now / 1000),
    raw = '{"type":"payment_intent.succeeded"}',
    secret = "whsec_fixture";
  const signature = `t=${t},v1=${createHmac("sha256", secret)
    .update(t + "." + raw)
    .digest("hex")}`;
  assert.equal(verifyWireSignature(raw, signature, secret, now), true);
  assert.equal(verifyWireSignature(raw + " ", signature, secret, now), false);
  assert.equal(
    verifyWireSignature(raw, signature, secret, now + 301000),
    false,
  );
  assert.equal(
    verifyWireSignature(raw, signature + ",t=" + t, secret, now),
    false,
  );
  assert.throws(() => trustedCheckout("https://pay.wire.mn.attacker.test/c/a"));
  assert.throws(() => trustedCheckout("http://pay.wire.mn/c/a"));
  const o = { provider_intent: "pi_fixture", amount: 50000, currency: "MNT" },
    pi = {
      id: "pi_fixture",
      status: "succeeded",
      amount: 50000,
      currency: "MNT",
    };
  assert.equal(paymentMatches(o, pi), true);
  for (const p of [
    { amount: 500 },
    { currency: "USD" },
    { id: "pi_other" },
    { status: "processing" },
  ])
    assert.equal(paymentMatches(o, { ...pi, ...p }), false);
});
test("payment settlement grants one credit pack exactly once; private settings and quotes are inaccessible to browser roles", async () => {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text);create function storage.foldername(text) returns text[] language sql as 'select string_to_array($1,''/'')';`,
  );
  for (const f of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync("supabase/migrations/" + f, "utf8"));
  const user = "11111111-1111-4111-8111-111111111111",
    order = "22222222-2222-4222-8222-222222222222";
  await db.query("insert into auth.users values($1)", [user]);
  await db.query("insert into public.profiles values($1,0)", [user]);
  await db.query(
    "insert into public.credit_orders(id,user_id,pack,amount,credits,provider_intent) values($1,$2,'Starter',50000,500,'pi_fixture')",
    [order, user],
  );
  await assert.rejects(
    db.query("select public.settle_credit_order($1,'pi_fixture',500,'MNT')", [
      order,
    ]),
    /mismatch/,
  );
  await db.query(
    "select public.settle_credit_order($1,'pi_fixture',50000,'MNT')",
    [order],
  );
  await db.query(
    "select public.settle_credit_order($1,'pi_fixture',50000,'MNT')",
    [order],
  );
  assert.equal(
    (await db.query<{ credits: number }>("select credits from public.profiles"))
      .rows[0].credits,
    500,
  );
  assert.equal(
    (
      await db.query<{ count: number }>(
        "select count(*)::integer as count from public.credit_payments_ledger",
      )
    ).rows[0].count,
    1,
  );
  const p = await db.query<{
    settings: boolean;
    quote: boolean;
    settle: boolean;
  }>(
    "select has_table_privilege('authenticated','public.studio_settings','select') as settings,has_column_privilege('authenticated','public.generations','price_quote','select') as quote,has_function_privilege('authenticated','public.settle_credit_order(uuid,text,integer,text)','execute') as settle",
  );
  assert.deepEqual(p.rows[0], { settings: false, quote: false, settle: false });
  await db.close();
});
