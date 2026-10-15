"use client";
import { useCallback, useEffect, useState } from "react";
import {
  LockKeyhole,
  Settings2,
  Wallet,
  SlidersHorizontal,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import type { StudioSettings } from "@/lib/settings-schema";
type Api = (path: string, init?: RequestInit) => Promise<any>;
type Model = {
  id: string;
  name: string;
  kind: string;
  quote?: { apiUsd: number; credits: number; totalMnt: number };
  rule: unknown;
  tariff?: { rates: string[]; source: string };
};
export function AdminConsole({
  api,
  signedIn,
  onSignIn,
}: {
  api: Api;
  signedIn: boolean;
  onSignIn: () => void;
}) {
  const [config, setConfig] = useState<StudioSettings | null>(null),
    [revision, setRevision] = useState(0),
    [wire, setWire] = useState({
      configured: false,
      webhookConfigured: false,
      mode: "test",
    }),
    [models, setModels] = useState<Model[]>([]),
    [orders, setOrders] = useState<any[]>([]),
    [tab, setTab] = useState("pricing"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [key, setKey] = useState(""),
    [secret, setSecret] = useState(""),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState(""),
    [rule, setRule] = useState("");
  const load = useCallback(async () => {
    try {
      const [s, m, p] = await Promise.all([
        api("/api/admin/settings"),
        api("/api/admin/models"),
        api("/api/admin/payments"),
      ]);
      setConfig(s.config);
      setRevision(s.revision);
      setWire(s.wire);
      setModels(m.models);
      setOrders(p.orders);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);
  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, load]);
  async function save() {
    if (!config) return;
    setBusy(true);
    setMessage("");
    try {
      await api("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revision,
          config,
          ...(key ? { wireApiKey: key } : {}),
          ...(secret ? { wireWebhookSecret: secret } : {}),
        }),
      });
      setKey("");
      setSecret("");
      await load();
      setMessage("Тохиргоо хадгалагдлаа. Шинэ хүсэлтэд шинэ үнэ үйлчилнэ.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!signedIn)
    return (
      <section className="admin-access">
        <LockKeyhole size={36} />
        <h1>Студийн удирдлага</h1>
        <p>Эзэмшигчийн баталгаажсан бүртгэлээр нэвтэрнэ үү.</p>
        <button className="primary" onClick={onSignIn}>
          Нэвтрэх
        </button>
      </section>
    );
  if (error)
    return (
      <section className="admin-access">
        <LockKeyhole size={36} />
        <h1>Админ эрх шаардлагатай</h1>
        <p role="alert">{error}</p>
      </section>
    );
  if (!config) return <p role="status">Удирдлагын тохиргоог ачаалж байна…</p>;
  const update = (k: keyof StudioSettings, v: unknown) =>
    setConfig({ ...config, [k]: v });
  return (
    <section className="admin-console">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PRIVATE / STUDIO OPERATIONS</span>
          <h1>Студийн удирдлага</h1>
          <p>Үнэ, загвар, төлбөрийн холболт · Хувилбар {revision}</p>
        </div>
        <button className="primary" disabled={busy} onClick={save}>
          {busy ? "Хадгалж байна…" : "Өөрчлөлт хадгалах"}
        </button>
      </div>
      <nav className="admin-tabs" aria-label="Админ хэсэг">
        {[
          ["pricing", "Үнэ тооцоо", SlidersHorizontal],
          ["models", "AI загварууд", Settings2],
          ["wire", "Wire.mn холболт", Wallet],
          ["orders", "Гүйлгээ", CheckCircle2],
        ].map(([id, title, Icon]) => {
          const I = Icon as typeof Wallet;
          return (
            <button
              key={String(id)}
              aria-pressed={tab === id}
              onClick={() => setTab(String(id))}
            >
              <I size={16} />
              {String(title)}
            </button>
          );
        })}
      </nav>
      {message && (
        <p className="admin-feedback" role="status">
          {message}
        </p>
      )}
      {tab === "pricing" && (
        <div className="admin-grid">
          <article className="admin-card">
            <h2>Борлуулалтын үнийн бодлого</h2>
            <div className="admin-fixed">
              <strong>200% markup</strong>
              <span>
                Зардлын суурь × 3. Хэрэглэгчид зөвхөн эцсийн үнэ харагдана.
              </span>
            </div>
            {[
              ["usdMnt", "Төлөвлөх USD ханш (₮)", 1],
              ["providerReserve", "API өртгийн нөөц (%)", 100],
              ["paymentFee", "Төлбөрийн шимтгэл (%)", 100],
              ["overheadMnt", "Нэг үүсгэлтийн ажиллагааны нөөц (₮)", 1],
            ].map(([id, title, m]) => (
              <label key={String(id)}>
                {String(title)}
                <input
                  type="number"
                  step="any"
                  value={Number(config[id as keyof StudioSettings]) * Number(m)}
                  onChange={(e) =>
                    update(
                      id as keyof StudioSettings,
                      Number(e.target.value) / Number(m),
                    )
                  }
                />
              </label>
            ))}
            <label>
              Тариф дахин хянах огноо
              <input
                type="date"
                value={config.validUntil}
                onChange={(e) => update("validUntil", e.target.value)}
              />
            </label>
            <p>
              Кредитийг дээш тоймлоно. Шинэ бодлого өмнөх ажлын суутгал,
              буцаалтыг өөрчлөхгүй.
            </p>
          </article>
          <article className="admin-card">
            <h2>Студийн ажиллагаа</h2>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={config.generationEnabled}
                onChange={(e) => update("generationEnabled", e.target.checked)}
              />
              Рендер, видео үүсгэлт нээлттэй
            </label>
            {[
              ["defaultImage", "Автомат рендер", "image"],
              ["defaultVideo", "Автомат видео", "video"],
            ].map(([id, title, kind]) => (
              <label key={id}>
                {title}
                <select
                  value={config[id as "defaultImage" | "defaultVideo"]}
                  onChange={(e) =>
                    update(id as keyof StudioSettings, e.target.value)
                  }
                >
                  {models
                    .filter(
                      (m) =>
                        m.kind === kind &&
                        m.quote &&
                        !config.disabledModels.includes(m.id),
                    )
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </label>
            ))}
            <h3>Кредитийн багц</h3>
            <p>
              Starter · 500 кредит / 50,000₮
              <br />
              Studio · 1,500 кредит / 150,000₮
              <br />
              Business · 5,000 кредит / 500,000₮
            </p>
            <small>
              1 кредит = 100₮. Багцын нэгж үнэ ижил тул хямдрал ашгийн тооцоог
              өөрчлөхгүй.
            </small>
          </article>
        </div>
      )}
      {tab === "models" && (
        <article className="admin-card">
          <h2>Нийлүүлэгчийн тариф ба эцсийн үнэ</h2>
          <p>
            Энэ мэдээлэл зөвхөн админд харагдана. Бодит хэрэглээний тооцоогүй
            загвар автоматаар нээгдэхгүй.
          </p>
          <input
            aria-label="Админ загвар хайх"
            placeholder="Загварын нэрээр хайх…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Загвар</th>
                  <th>API $</th>
                  <th>Борлуулах үнэ</th>
                  <th>Нээлттэй</th>
                  <th>Нарийн тохиргоо</th>
                </tr>
              </thead>
              <tbody>
                {models
                  .filter((m) =>
                    (m.name + m.id).toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((m) => (
                    <tr key={m.id}>
                      <td>
                        <strong>{m.name}</strong>
                        <small>{m.id}</small>
                      </td>
                      <td>{m.quote ? `$${m.quote.apiUsd}` : "Хувьсах"}</td>
                      <td>
                        {m.quote
                          ? `${m.quote.credits} кредит · ${m.quote.totalMnt.toLocaleString()}₮`
                          : "Тооцоо шаардлагатай"}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`${m.name} нээлттэй`}
                          checked={!config.disabledModels.includes(m.id)}
                          onChange={(e) =>
                            update(
                              "disabledModels",
                              e.target.checked
                                ? config.disabledModels.filter(
                                    (id) => id !== m.id,
                                  )
                                : [...config.disabledModels, m.id],
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="secondary small"
                          onClick={() => {
                            setEditing(m.id);
                            setRule(
                              JSON.stringify(
                                config.ruleOverrides[m.id] ||
                                  m.rule || { flat: 0.1 },
                                null,
                                2,
                              ),
                            );
                          }}
                        >
                          Засах
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {editing && (
            <div className="admin-rule">
              <h3>{editing}</h3>
              <p>
                Нэгжийн JSON тариф: flat, perSecond, resolutions, qualities
                эсвэл qualityResolutions-аас нэгийг сонгоно. input нь нэг
                оролтын нэмэлт $ өртөг.
              </p>
              <textarea
                aria-label="Нэгжийн тариф JSON"
                value={rule}
                onChange={(e) => setRule(e.target.value)}
                rows={8}
              />
              <button
                className="secondary"
                onClick={() => {
                  try {
                    update("ruleOverrides", {
                      ...config.ruleOverrides,
                      [editing]: JSON.parse(rule),
                    });
                    setEditing("");
                    setMessage(
                      "Тариф бэлтгэгдлээ. Өөрчлөлт хадгалах товчийг дарна уу.",
                    );
                  } catch {
                    setMessage("JSON бүтэц буруу байна.");
                  }
                }}
              >
                Тарифын өөрчлөлт бэлтгэх
              </button>
              <button
                className="secondary"
                onClick={() => {
                  const next = { ...config.ruleOverrides };
                  delete next[editing];
                  update("ruleOverrides", next);
                  setEditing("");
                }}
              >
                Анхны тариф руу буцаах
              </button>
              {models
                .find((m) => m.id === editing)
                ?.tariff?.rates.map((r, i) => (
                  <p key={i}>{r}</p>
                ))}
            </div>
          )}
        </article>
      )}
      {tab === "wire" && (
        <div className="admin-grid">
          <article className="admin-card">
            <h2>Wire.mn · Hosted checkout</h2>
            <p className="admin-fixed">
              {wire.configured ? "Түлхүүр тохируулсан" : "Түлхүүр шаардлагатай"}{" "}
              · {wire.mode === "live" ? "LIVE" : "TEST / тохируулаагүй"}
            </p>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={config.paymentsEnabled}
                onChange={(e) => update("paymentsEnabled", e.target.checked)}
              />
              Кредит цэнэглэх үйлчилгээ нээлттэй
            </label>
            <label>
              Wire.mn API key
              <input
                type="password"
                autoComplete="new-password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="sk_live_… · хоосон үлдээвэл хуучин түлхүүр хадгалагдана"
              />
            </label>
            <label>
              Webhook signing secret · заавал биш
              <input
                type="password"
                autoComplete="new-password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="whsec_…"
              />
            </label>
            <label>
              Операторууд · таслалаар тусгаарлах
              <input
                value={config.wireOperators.join(",")}
                onChange={(e) =>
                  update(
                    "wireOperators",
                    e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Хоосон = project дээр идэвхтэй бүх оператор"
              />
            </label>
            <p>
              Нууц түлхүүрийг шифрлэж хадгална. Хадгалсны дараа дахин
              харуулахгүй. Live түлхүүрт sandbox оператор ашиглахгүй.
            </p>
            <button
              className="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await api("/api/admin/settings", {
                    method: "POST",
                  });
                  setMessage(
                    `Wire.mn холбогдлоо · ${r.operators.length} оператор`,
                  );
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <RefreshCw size={14} />
              Хадгалсан холболт шалгах
            </button>
          </article>
          <article className="admin-card">
            <h2>Төлбөр баталгаажуулах</h2>
            <ol>
              <li>
                Өмнө ашигласан Wire.mn project-ийн live түлхүүрээ оруулаад
                хадгал.
              </li>
              <li>
                Холболт шалгах товчоор API болон операторын төлөвийг шалга.
              </li>
              <li>
                Хэрэглэгч Starter, Studio эсвэл Business багц сонгож Wire.mn
                дээр төлнө.
              </li>
              <li>
                Сервер төлөв, MNT дүн, гүйлгээний ID-г тулгаж кредитийг нэг удаа
                нэмнэ.
              </li>
            </ol>
            <label>
              Энэ сайтын webhook URL
              <input
                readOnly
                value="https://rainy-proptech-production.up.railway.app/api/payments/webhook"
              />
            </label>
            <p>
              Өмнөх сайтын webhook-ийг сольж болохгүй. Тусдаа endpoint ашиглах
              боломжтой үед signing secret-ээ оруулна. Webhook-гүй үед төлбөрийн
              төлөвийг серверээр шалгах урсгал ажиллана.
            </p>
            <p>
              Төлбөр орсон нь Fal дансыг автоматаар цэнэглэхгүй. Fal үлдэгдлийг
              эзэмшигч тусад нь удирдана.
            </p>
          </article>
        </div>
      )}
      {tab === "orders" && (
        <article className="admin-card">
          <h2>Сүүлийн кредит цэнэглэлтүүд</h2>
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Огноо</th>
                  <th>Захиалга</th>
                  <th>Багц</th>
                  <th>Дүн</th>
                  <th>Кредит</th>
                  <th>Төлөв</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.created_at).toLocaleString("mn-MN")}</td>
                    <td>{o.id.slice(0, 8)}</td>
                    <td>{o.pack}</td>
                    <td>{o.amount.toLocaleString()}₮</td>
                    <td>{o.credits}</td>
                    <td>
                      {o.status === "paid" ? "Баталгаажсан" : "Хүлээгдэж буй"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && <p>Одоогоор цэнэглэлт бүртгэгдээгүй.</p>}
          </div>
        </article>
      )}
    </section>
  );
}
