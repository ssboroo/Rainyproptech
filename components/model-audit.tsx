"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
type Entry = {
  id: string;
  name: string;
  kind: "image" | "video";
  docs: string;
  priced: boolean;
  tariff?: { source: string; rates: string[] };
  verification?: string;
};
export function ModelAudit({
  lang,
  onChoose,
  disabled,
}: {
  lang: "mn" | "en";
  onChoose: (id: string, kind: "image" | "video") => void;
  disabled: boolean;
}) {
  const [models, setModels] = useState<Entry[]>([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const filtered = models.filter((m) =>
    `${m.id} ${m.name}`.toLowerCase().includes(query.toLowerCase()),
  );
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  useEffect(() => {
    let alive = true;
    fetch("/api/models")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (alive) setModels(d.models);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  return (
    <section className="model-audit">
      <header>
        <h2>
          {t(
            "100 загварын шалгалтын бүртгэл",
            "100-model verification register",
          )}
        </h2>
        <p>
          {t(
            "Схемийн шалгалт нь бодит зургийн чанарын туршилт биш. Төлбөртэй жишиг үүсгэлт хийгээгүй загварыг туршсан гэж тэмдэглээгүй.",
            "Schema verification is separate from visual quality testing. Models without paid benchmark runs are not marked as visually tested.",
          )}
        </p>
      </header>
      <label className="audit-search">
        <Search size={16} />
        <input
          aria-label={t("Бүртгэлээс загвар хайх", "Search model register")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t("Загварын нэрээр хайх…", "Search model name…")}
        />
      </label>
      {error ? (
        <p role="alert">
          {t(
            "Каталог ачаалсангүй. Хуудсаа шинэчилнэ үү.",
            "Catalog unavailable. Refresh this page.",
          )}
        </p>
      ) : !models.length ? (
        <p role="status">{t("Бүртгэл ачаалж байна…", "Loading register…")}</p>
      ) : (
        <div className="audit-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("AI загвар", "Model")}</th>
                <th>{t("Схем", "Schema")}</th>
                <th>{t("Үнэ", "Pricing")}</th>
                <th>{t("Үйлдэл", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 10, (page + 1) * 10).map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                    <small>
                      {m.kind === "image"
                        ? t("Зураг", "Image")
                        : t("Видео", "Video")}{" "}
                      · {m.id}
                    </small>
                    <a href={m.docs} target="_blank" rel="noreferrer">
                      Fal API <ArrowUpRight size={11} />
                    </a>
                  </td>
                  <td>
                    <span
                      className={
                        m.verification === "matched"
                          ? "audit-ok"
                          : "audit-pending"
                      }
                    >
                      {m.verification === "matched"
                        ? t("Нийцсэн", "Matched")
                        : t("Дахин шалгах", "Review required")}
                    </span>
                  </td>
                  <td>
                    {m.priced
                      ? t("Баталгаажсан", "Reviewed")
                      : m.tariff?.rates.length
                        ? t("Хувьсах нэгжийн тариф", "Metered tariff")
                        : t("Өртөг баталгаажуулах", "Cost review pending")}
                    {!!m.tariff?.rates.length && (
                      <details className="tariff-detail">
                        <summary>
                          {t("Албан ёсны тариф харах", "View provider tariff")}
                        </summary>
                        {m.tariff.rates.map((r, i) => (
                          <p key={i}>{r.replaceAll("**", "")}</p>
                        ))}
                        {!m.priced && (
                          <p className="tariff-note">
                            {t(
                              "Тариф олдсон. Токен, нийт пиксел, боловсруулалтын хугацаа эсвэл оролтын хэмжээг тооцох адаптер шаардлагатай тул урьдчилсан суутгал хараахан нээгдээгүй.",
                              "Tariff found. Prepaid selection requires an adapter that meters tokens, pixels, runtime or input size reliably.",
                            )}
                          </p>
                        )}
                        <a
                          href={m.tariff.source}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t("Эх сурвалж ↗", "Source ↗")}
                        </a>
                      </details>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={
                        disabled || !m.priced || m.verification !== "matched"
                      }
                      onClick={() => onChoose(m.id, m.kind)}
                    >
                      {t("Сонгох", "Select")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="audit-pagination">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              {t("Өмнөх", "Previous")}
            </button>
            <span>
              {Math.min(page * 10 + 1, filtered.length)}–
              {Math.min((page + 1) * 10, filtered.length)} / {filtered.length}
            </span>
            <button
              disabled={(page + 1) * 10 >= filtered.length}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Дараах", "Next")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
