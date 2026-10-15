"use client";
import { useEffect, useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
type Mode = "auto" | "quality" | "speed" | "structure";
type Entry = {
  id: string;
  name: string;
  kind: "image" | "video";
  docs: string;
};
export function ModelPicker({
  lang,
  mode,
  image,
  video,
  onChange,
  disabled,
}: {
  lang: "mn" | "en";
  mode: Mode;
  image: string;
  video: string;
  onChange: (mode: Mode, image: string, video: string) => void;
  disabled: boolean;
}) {
  const [models, setModels] = useState<Entry[]>([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
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
        if (alive) setError(t("Каталог ачаалсангүй", "Catalog unavailable"));
      });
    return () => {
      alive = false;
    };
  }, []);
  const choices = [
    ["auto", "Автомат", "Auto"],
    ["quality", "Чанар", "Quality"],
    ["speed", "Хурд", "Speed"],
    ["structure", "Бүтэц", "Structure"],
  ] as const;
  return (
    <section className="model-picker">
      <label className="section-label">
        <Sparkles size={14} />
        {t("AI загвар сонголт", "AI model routing")}
        <span className="model-count">
          {models.length ? `${models.length} models` : error || "…"}
        </span>
      </label>
      <div className="routing-modes">
        {choices.map(([key, mn, en]) => (
          <button
            type="button"
            key={key}
            disabled={disabled}
            aria-pressed={mode === key && !image && !video}
            className={mode === key && !image && !video ? "selected" : ""}
            onClick={() => onChange(key, "", "")}
          >
            {t(mn, en)}
          </button>
        ))}
      </div>
      <p className="hint">
        {t(
          "Төслийн төрөл, камерын хөдөлгөөнд тохирох загварыг автоматаар сонгоно.",
          "Chooses a model policy for your project and camera movement.",
        )}
      </p>
      <details>
        <summary>
          {t("Загварыг өөрөө сонгох", "Choose a model manually")}
          <ChevronDown size={12} />
        </summary>
        <input
          aria-label={t("Загвар хайх", "Search models")}
          placeholder={t("Загвар хайх…", "Search models…")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        {(["image", "video"] as const).map((kind) => (
          <label key={kind}>
            {kind === "image"
              ? t("Рендерийн загвар", "Render model")
              : t("Видеоны загвар", "Video model")}
            <select
              disabled={disabled}
              value={kind === "image" ? image : video}
              onChange={(e) =>
                onChange(
                  mode,
                  kind === "image" ? e.target.value : image,
                  kind === "video" ? e.target.value : video,
                )
              }
            >
              <option value="">
                {t("Автоматаар сонгох", "Choose automatically")}
              </option>
              {models
                .filter(
                  (m) =>
                    m.kind === kind &&
                    (!query ||
                      `${m.id} ${m.name}`
                        .toLowerCase()
                        .includes(query.toLowerCase()) ||
                      m.id === (kind === "image" ? image : video)),
                )
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.id}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <p className="hint">
          {t(
            "Каталогт рендер, сайжруулалт болон видео загварууд орно. Бүх загварыг бодит төлбөртэй үүсгэлтээр туршаагүй.",
            "Includes rendering, enhancement and video models. Not all models have been tested with paid generations.",
          )}
        </p>
      </details>
    </section>
  );
}
