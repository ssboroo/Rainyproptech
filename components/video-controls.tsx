"use client";
import { useEffect, useState } from "react";
import { Film, Monitor, Timer, Award } from "lucide-react";
type Entry = {
  id: string;
  name: string;
  priced: boolean;
  kind: string;
  videoOptions?: {
    durations: number[];
    resolutions: string[];
    defaultResolution: string;
  };
};
export function VideoControls({
  lang,
  modelId,
  manual,
  duration,
  resolution,
  disabled,
  onChange,
  onModel,
}: {
  lang: "mn" | "en";
  modelId: string;
  manual: boolean;
  duration: number;
  resolution: string;
  disabled: boolean;
  onChange: (d: number, r: string) => void;
  onModel: (id: string) => void;
}) {
  const [models, setModels] = useState<Entry[]>([]);
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
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const model = models.find((m) => m.id === modelId),
    opts = model?.videoOptions;
  const resolutions = manual ? opts?.resolutions || [] : ["1080p", "4K"];
  const ds = opts?.durations || [];
  useEffect(() => {
    if (!opts) return;
    const d = ds.includes(duration) ? duration : ds.includes(5) ? 5 : ds[0];
    const r =
      resolutions.find((v) => v.toLowerCase() === resolution.toLowerCase()) ||
      opts.defaultResolution;
    if (d && (d !== duration || r !== resolution)) onChange(d, r);
  }, [modelId, models, manual, duration, resolution]);
  const recommended = [
    ["fal-ai/kling-video/v3/pro/image-to-video", "Kling 3 Pro", "1080p"],
    ["fal-ai/kling-video/o3/pro/image-to-video", "Kling O3 Pro", "1080p"],
    ["fal-ai/kling-video/v3/4k/image-to-video", "Kling Native 4K", "4K"],
  ];
  return (
    <div className="video-controls">
      <div className="section-label">
        <Award size={15} />
        {t("Чанарт чиглэсэн сонголтууд", "Quality-focused choices")}
      </div>
      <div className="video-model-cards">
        {recommended.map(([id, name, res]) => (
          <button
            type="button"
            key={id}
            disabled={disabled}
            aria-pressed={id === modelId}
            className={id === modelId ? "selected" : ""}
            onClick={() => onModel(id)}
          >
            <Film size={18} />
            <strong>{name}</strong>
            <small>
              {res} · {t("Дуугүй", "Audio off")}
            </small>
          </button>
        ))}
      </div>
      <div className="video-settings-grid">
        <label>
          <Timer size={15} />
          {t("Видеоны урт", "Video duration")}
          <select
            aria-label={t("Видеоны урт", "Video duration")}
            value={duration}
            disabled={disabled || !ds.length}
            onChange={(e) => onChange(Number(e.target.value), resolution)}
          >
            {ds.map((d) => (
              <option key={d} value={d}>
                {d} {t("секунд", "seconds")}
              </option>
            ))}
          </select>
        </label>
        <label>
          <Monitor size={15} />
          {t("Дүрсний нягтаршил", "Output resolution")}
          <select
            aria-label={t("Дүрсний нягтаршил", "Output resolution")}
            disabled={disabled || !resolutions.length}
            value={resolution}
            onChange={(e) => onChange(duration, e.target.value)}
          >
            {resolutions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="hint">
        {t(
          "Видеоны урт нь боловсруулах хугацаа биш. Дараалал, загвараас хамаарч хэдэн минут шаардаж болно. Кадрын харьцаа эх зургаас хамаарна; MP4 файлын хэмжээ үүссэний дараа тодорхой болно.",
          "Clip length is different from processing time. Queue and model may take several minutes. Aspect ratio follows the reference; MP4 file size is known after generation.",
        )}
      </p>
      <p className="hint">
        {t(
          "“Хамгийн сайн” үр дүнг баталгаажуулахын тулд өөрийн CAD/зурагтай харьцуулж шалгана. Эдгээр нь чанарт чиглэсэн сонголт; бүх загварыг ижил зураг дээр төлбөртэй туршаагүй.",
          "These are quality-focused choices, not a paid head-to-head benchmark. Compare each result against your own CAD/reference.",
        )}
      </p>
    </div>
  );
}
