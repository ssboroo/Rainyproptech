"use client";
import { useState } from "react";
import {
  ArrowUpRight,
  ImageIcon,
  Video,
  ScanLine,
  LockKeyhole,
  Plus,
  RefreshCw,
} from "lucide-react";
import { completedResults, ResultItem } from "@/lib/results";
import { Button } from "./ui/button";
export function ResultsGallery<T extends ResultItem>({
  jobs,
  lang,
  signedIn,
  onOpen,
  onStart,
  onRefresh,
}: {
  jobs: T[];
  lang: "mn" | "en";
  signedIn: boolean;
  onOpen: (job: T) => void;
  onStart: () => void;
  onRefresh: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  const all = completedResults(jobs),
    shown = completedResults(jobs, filter);
  return (
    <section id="results" className="results-section">
      <div className="results-heading">
        <div>
          <div className="eyebrow">THE REAL OUTPUT</div>
          <h2>
            {t(
              "Таны зургийн дараагийн дүр төрх.",
              "The next version of your vision.",
            )}
          </h2>
          <p>
            {t(
              "Таны эх зургаас үүссэн рендер, видео. Зөвхөн бэлэн бүтээлүүд энд харагдана.",
              "Renders and films made from your source. Only completed outputs appear here.",
            )}
          </p>
        </div>
        <span className="private-badge">
          <LockKeyhole size={12} />
          {t("Зөвхөн танд", "Private to you")}
        </span>
      </div>
      <div className="gallery-toolbar">
        <div className="gallery-filters">
          {(["all", "image", "video"] as const).map((k) => (
            <button
              key={k}
              aria-pressed={filter === k}
              className={filter === k ? "active" : ""}
              onClick={() => setFilter(k)}
            >
              {k === "all"
                ? t("Бүгд", "All")
                : k === "image"
                  ? t("Рендер", "Renders")
                  : t("Видео", "Films")}
              <span>
                {k === "all"
                  ? all.length
                  : all.filter((g) => g.kind === k).length}
              </span>
            </button>
          ))}
        </div>
        {signedIn && (
          <button
            className="refresh-gallery"
            onClick={onRefresh}
            aria-label={t("Үр дүн шинэчлэх", "Refresh results")}
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
      {shown.length ? (
        <div className="results-grid">
          {shown.map((g) => (
            <article key={g.id} className="result-card">
              <button
                className="result-visual"
                onClick={() => onOpen(g)}
                aria-label={t("Бүтээлийг нээх", "Open creation")}
              >
                {g.kind === "image" ? (
                  <img
                    loading="lazy"
                    src={g.output_url!}
                    alt={t(
                      "Таны үүсгэсэн AI рендер",
                      "Your generated AI render",
                    )}
                  />
                ) : (
                  <video
                    src={g.output_url!}
                    preload="metadata"
                    muted
                    playsInline
                  />
                )}
                <span className="result-kind">
                  {g.kind === "image" ? (
                    <ImageIcon size={12} />
                  ) : (
                    <Video size={12} />
                  )}{" "}
                  {g.kind === "image" ? "AI RENDER" : "CINEMATIC VIDEO"}
                </span>
                <span className="result-open">
                  <ArrowUpRight size={19} />
                </span>
              </button>
              <div className="result-card-caption">
                <span>
                  <strong>
                    {g.kind === "image"
                      ? t("Бэлэн рендер", "Completed render")
                      : t("Бэлэн видео", "Completed film")}
                  </strong>
                  <small>
                    {g.created_at
                      ? new Intl.DateTimeFormat(
                          lang === "mn" ? "mn-MN" : "en-GB",
                          { dateStyle: "medium" },
                        ).format(new Date(g.created_at))
                      : ""}
                  </small>
                </span>
                <button
                  onClick={() => onOpen(g)}
                  aria-label={t("Бүтээлийг нээх", "Open creation")}
                >
                  {g.kind === "image" ? (
                    <ScanLine size={16} />
                  ) : (
                    <Video size={16} />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="gallery-empty">
          <div className="empty-pair">
            <span>
              <ImageIcon size={23} />
              <small>SOURCE</small>
            </span>
            <i>→</i>
            <span>
              <ScanLine size={23} />
              <small>YOUR RESULT</small>
            </span>
          </div>
          <h3>
            {all.length
              ? t(
                  "Энэ төрлийн бүтээл хараахан алга.",
                  "No creations in this category yet.",
                )
              : t(
                  "Эхний бодит бүтээлээ эндээс эхлүүл.",
                  "Your first real creation starts here.",
                )}
          </h3>
          <p>
            {t(
              "Бэлэн жишээ зураг бус, таны эх зурагт тулгуурласан үр дүнг хадгална.",
              "This space holds your generated results, not stock examples.",
            )}
          </p>
          <Button className="dark" onClick={onStart}>
            <Plus size={15} />
            {signedIn
              ? t("Эх зургаа оруулах", "Upload your source")
              : t("Нэвтэрч эхлэх", "Sign in to create")}
            <ArrowUpRight size={15} />
          </Button>
        </div>
      )}
    </section>
  );
}
