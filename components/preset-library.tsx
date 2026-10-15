"use client";
import { useEffect, useRef, useState } from "react";
import {
  X,
  Search,
  Check,
  ArrowUpRight,
  SlidersHorizontal,
} from "lucide-react";
import {
  projects,
  styles,
  projectKeys,
  styleKeys,
  category,
  isInteriorStyle,
  type Project,
  type Style,
} from "@/lib/presets";
import { ArchitectureIcon, StyleDrawing } from "./architecture-icon";
const groups: Record<string, [string, string]> = {
  residential: ["Орон сууц", "Residential"],
  commercial: ["Бизнес", "Commercial"],
  civic: ["Олон нийтийн", "Civic"],
  industrial: ["Үйлдвэрлэл", "Industrial"],
  site: ["Хот, ландшафт", "Site & landscape"],
  interior: ["Интерьер", "Interiors"],
  contemporary: ["Орчин үеийн", "Contemporary"],
  heritage: ["Өв, сонгодог", "Heritage"],
  natural: ["Байгальд ойр", "Natural"],
  material: ["Материал", "Material"],
};
export function PresetLibrary({
  kind,
  mode,
  value,
  lang,
  disabled,
  onChange,
}: {
  kind: "project" | "style";
  mode: "interior" | "exterior";
  value: Project | Style;
  lang: "mn" | "en";
  disabled: boolean;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState(""),
    [group, setGroup] = useState("all");
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  const keys: string[] =
    kind === "project"
      ? projectKeys.filter(
          (p) => (category(p) === "interior") === (mode === "interior"),
        )
      : styleKeys.filter((s) => isInteriorStyle(s) === (mode === "interior"));
  const data: Record<
    string,
    { mn: string; en: string; icon: string; group: string; color?: string }
  > = kind === "project" ? projects : styles;
  const selected = data[value];
  const available = [...new Set(keys.map((k) => data[k].group))];
  const shown = keys.filter(
    (k) =>
      (group === "all" || data[k].group === group) &&
      `${data[k].mn} ${data[k].en}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const featured = keys.slice(0, 4);
  if (!featured.includes(value) && keys.includes(value))
    featured[featured.length - 1] = value;
  return (
    <>
      <div className="preset-section-heading">
        <label className="section-label">
          <span>{kind === "project" ? "01" : "03"}</span>
          {kind === "project"
            ? t("Барилгын төрөл", "Building typology")
            : t("Архитектурын хэв маяг", "Design language")}
        </label>
        <span className="preset-count">{keys.length}</span>
      </div>
      <div className={kind === "project" ? "typology-quick" : "style-quick"}>
        {featured.map((k) => (
          <button
            key={k}
            disabled={disabled}
            className={value === k ? "selected" : ""}
            aria-pressed={value === k}
            onClick={() => onChange(k)}
          >
            {kind === "style" ? (
              <span
                className="material-dot"
                style={{ background: data[k].color }}
              >
                <ArchitectureIcon name={data[k].icon} size={17} />
              </span>
            ) : (
              <ArchitectureIcon name={data[k].icon} size={23} />
            )}
            <span>{data[k][lang]}</span>
            {value === k && <Check className="preset-check" size={13} />}
          </button>
        ))}
      </div>
      <button
        disabled={disabled}
        className="browse-presets"
        onClick={() => {
          setSearch("");
          setGroup("all");
          setOpen(true);
        }}
      >
        <SlidersHorizontal size={14} />
        {kind === "project"
          ? t("Бүх төрлийг үзэх", "Explore typologies")
          : t("Хэв маягийн сан", "Explore design library")}
        <ArrowUpRight size={15} />
      </button>
      {open && (
        <LibraryDialog onClose={() => setOpen(false)}>
          <header>
            <div>
              <span className="eyebrow">RAINY VISTA / DESIGN LIBRARY</span>
              <h2>
                {kind === "project"
                  ? t("Ямар орон зай бүтээх вэ?", "What are you creating?")
                  : t(
                      "Архитектурын хэлээ сонго.",
                      "Find your architectural language.",
                    )}
              </h2>
              <p>
                {kind === "project"
                  ? t(
                      "Орон сууцнаас хотын ерөнхий төлөвлөгөө хүртэл.",
                      "From a private home to an entire city plan.",
                    )
                  : t(
                      "Хэв маяг нь материал, гэрлийг чиглүүлнэ. Эх зургийн бүтцийг хадгална.",
                      "Styles guide materials and light while preserving your source geometry.",
                    )}
              </p>
            </div>
            <button
              className="icon-button"
              aria-label={t("Хаах", "Close")}
              onClick={() => setOpen(false)}
            >
              <X size={22} />
            </button>
          </header>
          <div className="library-tools">
            <label className="library-search">
              <Search size={17} />
              <input
                autoFocus
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Нэрээр хайх…", "Search the library…")}
                aria-label={t("Хайх", "Search")}
              />
              <span>{shown.length}</span>
            </label>
            <div className="library-groups">
              <button
                aria-pressed={group === "all"}
                onClick={() => setGroup("all")}
              >
                {t("Бүгд", "All")}
              </button>
              {available.map((g) => (
                <button
                  key={g}
                  aria-pressed={group === g}
                  onClick={() => setGroup(g)}
                >
                  {groups[g]?.[lang === "mn" ? 0 : 1] || g}
                </button>
              ))}
            </div>
          </div>
          <div
            className={
              "library-grid " +
              (kind === "style" ? "style-library" : "project-library")
            }
          >
            {shown.map((k) => {
              const d = data[k];
              return (
                <button
                  key={k}
                  className={value === k ? "selected" : ""}
                  aria-pressed={value === k}
                  onClick={() => {
                    onChange(k);
                    setOpen(false);
                  }}
                >
                  {kind === "style" ? (
                    <StyleDrawing color={d.color!} motif={d.icon} />
                  ) : (
                    <span className="typology-icon">
                      <ArchitectureIcon name={d.icon} size={33} />
                    </span>
                  )}
                  <span className="library-item-meta">
                    <small>{groups[d.group]?.[lang === "mn" ? 0 : 1]}</small>
                    <strong>{d[lang]}</strong>
                  </span>
                  <span className="library-select">
                    {value === k ? (
                      <Check size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </span>
                </button>
              );
            })}
            {!shown.length && (
              <p className="library-no-results">
                {t(
                  "Илэрц олдсонгүй. Өөр нэрээр хайна уу.",
                  "No matches. Try another search.",
                )}
              </p>
            )}
          </div>
          <footer>
            <span>
              <ArchitectureIcon name={selected.icon} size={16} />{" "}
              {selected[lang]}
            </span>
            <span>
              {kind === "style"
                ? t(
                    "Вектор дүрслэл · Жишээ рендер биш",
                    "Vector motifs · Not sample renders",
                  )
                : t(
                    "Төсөлдөө таарсан төрлийг сонгоно уу",
                    "Choose the typology that fits your project",
                  )}
            </span>
          </footer>
        </LibraryDialog>
      )}
    </>
  );
}
function LibraryDialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="library-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {children}
    </dialog>
  );
}
