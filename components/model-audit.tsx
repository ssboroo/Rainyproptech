"use client";
import { useEffect, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import type { RetailQuote } from "@/lib/public-pricing";
type Entry = {
  id: string;
  name: string;
  kind: "image" | "video";
  priced: boolean;
  retail?: RetailQuote;
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
    [error, setError] = useState(false),
    [page, setPage] = useState(0);
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
  const filtered = models.filter((m) =>
    (m.name + m.id).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="model-audit">
      <header>
        <span className="eyebrow">THE MODEL COLLECTION</span>
        <h2>
          {t("Таны бүтээлд тохирох загвар", "Choose your creative engine")}
        </h2>
        <p>
          {t(
            "Нэг үүсгэлтийн нийт үнэ. Нягтаршил, хугацаагаа өөрчилбөл шинэ үнэ студид харагдана.",
            "The total for one generation. Your studio updates the price when resolution or duration changes.",
          )}
        </p>
      </header>
      <label className="audit-search">
        <Search size={16} />
        <input
          aria-label={t("Загвар хайх", "Search models")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder={t("Загварын нэрээр хайх…", "Search models…")}
        />
      </label>
      {error ? (
        <p role="alert">
          {t(
            "Каталог ачаалсангүй. Дахин нээнэ үү.",
            "Catalog unavailable. Please retry.",
          )}
        </p>
      ) : !models.length ? (
        <p role="status">{t("Ачаалж байна…", "Loading…")}</p>
      ) : (
        <div className="audit-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("Загвар", "Model")}</th>
                <th>{t("Тохиргоо", "Output")}</th>
                <th>{t("Нийт үнэ", "Total price")}</th>
                <th>{t("Сонгох", "Action")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(page * 10, (page + 1) * 10).map((m) => (
                <tr key={m.id}>
                  <td>
                    <strong>{m.name}</strong>
                    <small>
                      {m.kind === "image"
                        ? t("Архитектурын дүрслэл", "Architectural render")
                        : t("Кино мэт видео", "Cinematic video")}
                    </small>
                  </td>
                  <td>
                    {m.retail
                      ? `${m.retail.resolution === "model native" ? t("Эх харьцаа", "Native output") : m.retail.resolution}${m.retail.duration ? ` · ${m.retail.duration}s` : ""}`
                      : "—"}
                  </td>
                  <td>
                    {m.retail ? (
                      <>
                        <strong>{m.retail.totalMnt.toLocaleString()}₮</strong>
                        <small>
                          {m.retail.credits} {t("кредит", "credits")}
                        </small>
                      </>
                    ) : (
                      t("Түр боломжгүй", "Currently unavailable")
                    )}
                  </td>
                  <td>
                    <button
                      disabled={disabled || !m.priced}
                      onClick={() => onChoose(m.id, m.kind)}
                    >
                      {t("Сонгох", "Select")}
                      <ArrowUpRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p>{t("Тохирох загвар олдсонгүй.", "No matching models.")}</p>
          )}
          <div className="audit-pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              {t("Өмнөх", "Previous")}
            </button>
            <span>
              {Math.min(page * 10 + 1, filtered.length)}–
              {Math.min((page + 1) * 10, filtered.length)} / {filtered.length}
            </span>
            <button
              disabled={(page + 1) * 10 >= filtered.length}
              onClick={() => setPage(page + 1)}
            >
              {t("Дараах", "Next")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
