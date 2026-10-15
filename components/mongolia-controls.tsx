"use client";
import { MapPin, Sun } from "lucide-react";
import {
  scenes,
  seasons,
  type Scene,
  type Season,
} from "@/lib/mongolia-context";
export function MongoliaControls({
  lang,
  scene,
  season,
  disabled,
  onChange,
}: {
  lang: "mn" | "en";
  scene: Scene;
  season: Season;
  disabled: boolean;
  onChange: (s: Scene, w: Season) => void;
}) {
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  return (
    <section className="mongolia-controls">
      <label className="section-label">
        <MapPin size={15} />
        {t("Монгол орчин", "Mongolian setting")}
        <span className="local-badge">MN</span>
      </label>
      <label>
        {t("Байршлын уур амьсгал", "Location context")}
        <select
          value={scene}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as Scene, season)}
        >
          {Object.entries(scenes).map(([k, v]) => (
            <option key={k} value={k}>
              {lang === "mn" ? v.mn : v.en}
            </option>
          ))}
        </select>
      </label>
      <label>
        <Sun size={12} />
        {t("Улирал", "Season")}
        <select
          value={season}
          disabled={disabled}
          onChange={(e) => onChange(scene, e.target.value as Season)}
        >
          {Object.entries(seasons).map(([k, v]) => (
            <option key={k} value={k}>
              {v[lang === "mn" ? 0 : 1]}
            </option>
          ))}
        </select>
      </label>
      <p>
        {t(
          "Эх зургийн барилгын хэлбэрийг хадгалж, орчин ба гэрлийг чиглүүлнэ. Видео нь бэлэн рендерийн орчноо хадгална.",
          "Preserves source architecture while guiding surroundings and light. Videos inherit the completed render’s setting.",
        )}
      </p>
    </section>
  );
}
