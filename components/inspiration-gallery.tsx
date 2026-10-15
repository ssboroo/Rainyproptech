"use client";
import { ArrowUpRight } from "lucide-react";
import { visualFor } from "@/lib/visual-catalog";
import type { Project, Style } from "@/lib/presets";
export function InspirationGallery({
  lang,
  mode,
  onChoose,
  disabled,
}: {
  lang: "mn" | "en";
  mode: "interior" | "exterior";
  onChoose: (project: Project, style: Style) => void;
  disabled: boolean;
}) {
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  const items: {
    project: Project;
    style: Style;
    title: [string, string];
    subtitle: string;
  }[] =
    mode === "interior"
      ? [
          {
            project: "living_room",
            style: "interior_japandi",
            title: ["Тайван орон зай", "A quieter kind of home"],
            subtitle: "JAPANDI / LIVING",
          },
          {
            project: "kitchen",
            style: "interior_modern",
            title: ["Материалын мэдрэмж", "Made of natural things"],
            subtitle: "NATURAL / KITCHEN",
          },
          {
            project: "bedroom",
            style: "interior_scandinavian",
            title: ["Гэрэлтэй амьдрахуй", "Room for slow mornings"],
            subtitle: "SOFT LIGHT / BEDROOM",
          },
        ]
      : [
          {
            project: "exterior_facade",
            style: "modern_glass",
            title: ["Гэрэл ба шил", "A study in light"],
            subtitle: "CONTEMPORARY / RESIDENTIAL",
          },
          {
            project: "townhouse",
            style: "minimalist",
            title: ["Таны хувийн орон зай", "A place to call your own"],
            subtitle: "MINIMAL / TOWNHOUSE",
          },
          {
            project: "master_plan",
            style: "eco_residential",
            title: ["Нэгэн цогц ертөнц", "A neighborhood in harmony"],
            subtitle: "LANDSCAPE / MASTER PLAN",
          },
        ];
  return (
    <section className="inspiration-section">
      <header>
        <div>
          <span className="eyebrow">THE VISUAL JOURNAL</span>
          <h2>{t("Боломжийг зураглан хар.", "See what could be.")}</h2>
        </div>
        <p>
          {t(
            "AI жишээ дүрслэлүүд. Материал, гэрэл, хэв маягийн санаа аваарай.",
            "Original AI concepts. Explore materials, light and atmosphere.",
          )}
        </p>
      </header>
      <div className="inspiration-grid">
        {items.map((item, i) => (
          <button
            key={item.project}
            disabled={disabled}
            onClick={() => onChoose(item.project, item.style)}
          >
            <span className="journal-image">
              <img
                src={visualFor(
                  i === 0 ? "style" : "project",
                  i === 0 ? item.style : item.project,
                  true,
                )}
                alt={t(
                  item.title[0] + " — AI жишээ",
                  item.title[1] + " — AI concept",
                )}
                loading="lazy"
                decoding="async"
              />
              <span>AI CONCEPT / 0{i + 1}</span>
              <i>
                <ArrowUpRight size={21} />
              </i>
            </span>
            <span className="journal-caption">
              <small>{item.subtitle}</small>
              <strong>{item.title[lang === "mn" ? 0 : 1]}</strong>
              <span>
                {t("Энэ чиглэлийг сонгох", "Explore this direction")} ↗
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
