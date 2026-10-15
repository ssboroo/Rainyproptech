"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  X,
  Check,
  FileBox,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Move,
  ZoomIn,
} from "lucide-react";
import { sourceFormat, importError } from "@/lib/importer/formats";
import { cleanCadSvg } from "@/lib/importer/svg";
const ModelView = dynamic(
  () => import("./model-view").then((m) => m.ModelView),
  { ssr: false },
);
export function ImportDialog({
  file,
  lang,
  onClose,
  onConfirm,
}: {
  file: File;
  lang: "mn" | "en";
  onClose: () => void;
  onConfirm: (file: File, original: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    capture = useRef<null | (() => Promise<Blob>)>(null);
  const [glb, setGlb] = useState<ArrayBuffer | null>(null),
    [svgUrl, setSvgUrl] = useState(""),
    [error, setError] = useState(""),
    [warning, setWarning] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [confirmed, setConfirmed] = useState(false),
    [zoom, setZoom] = useState(1);
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  const fail = useCallback((e: string) => {
    setError(e);
    setLoading(false);
  }, []);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    let stopped = false,
      url = "";
    const extension = sourceFormat(file.name)!;
    const worker =
      extension === "dwg"
        ? new Worker("/cad/dwg-worker.js", { type: "module" })
        : new Worker(
            new URL("../../lib/importer/cad-worker.ts", import.meta.url),
            { type: "module" },
          );
    const timer = setTimeout(() => {
      worker.terminate();
      if (!stopped) fail("TIMEOUT");
    }, 60000);
    worker.onerror = () => {
      clearTimeout(timer);
      worker.terminate();
      if (!stopped) fail("READ_FAILED");
    };
    worker.onmessage = ({ data }) => {
      clearTimeout(timer);
      worker.terminate();
      if (stopped) return;
      if (data.error) {
        fail(data.error);
        return;
      }
      try {
        if (data.type === "glb") setGlb(data.buffer);
        else {
          url = URL.createObjectURL(
            new Blob([cleanCadSvg(data.svg)], { type: "image/svg+xml" }),
          );
          setSvgUrl(url);
          setWarning(data.warning || "");
        }
        setLoading(false);
      } catch (e) {
        fail(e instanceof Error ? e.message : "READ_FAILED");
      }
    };
    file
      .arrayBuffer()
      .then((buffer) => {
        if (!stopped)
          worker.postMessage(
            extension === "dwg" ? buffer : { buffer, extension },
            [buffer],
          );
      })
      .catch(() => fail("READ_FAILED"));
    return () => {
      stopped = true;
      clearTimeout(timer);
      worker.terminate();
      if (url) URL.revokeObjectURL(url);
    };
  }, [file, fail]);
  async function accept() {
    setSaving(true);
    try {
      let blob: Blob;
      if (glb) {
        if (!capture.current) throw new Error("MODEL_READ_FAILED");
        blob = await capture.current();
      } else {
        const image = new Image();
        image.src = svgUrl;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 2048;
        canvas.height = 1536;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 2048, 1536);
        ctx.drawImage(image, 0, 0, 2048, 1536);
        blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error("CAPTURE_FAILED"))),
            "image/png",
          ),
        );
      }
      if (blob.size > 15 * 1024 * 1024) throw new Error("CAPTURE_TOO_LARGE");
      onConfirm(
        new File([blob], file.name.replace(/\.[^.]+$/, "") + "-view.png", {
          type: "image/png",
        }),
        file.name,
      );
    } catch (e) {
      fail(e instanceof Error ? e.message : "CAPTURE_FAILED");
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="import-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header>
        <div className="dialog-title">
          <span className="dialog-icon">
            <FileBox size={22} />
          </span>
          <div>
            <span className="eyebrow">DRAWING ROOM / IMPORT</span>
            <h2>{t("Эх файлаа бэлтгэх", "Prepare your source")}</h2>
          </div>
        </div>
        <button
          aria-label={t("Хаах", "Close")}
          className="icon-button"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="import-file">
        <strong>{file.name}</strong>
        <span>
          {(file.size / 1024 / 1024).toFixed(1)} MB ·{" "}
          {sourceFormat(file.name)?.toUpperCase()}
        </span>
      </div>
      <div className="import-stage">
        {loading ? (
          <div className="import-status" role="status">
            <Loader2 className="spin" size={30} />
            <h3>{t("Геометрийг уншиж байна…", "Reading geometry…")}</h3>
            <p>
              {t(
                "Файл таны төхөөрөмж дээр боловсруулагдана.",
                "Your file is processed on your device.",
              )}
            </p>
          </div>
        ) : error ? (
          <div className="import-status" role="alert">
            <AlertTriangle size={30} />
            <h3>{t("Файлыг нээж чадсангүй", "Could not open this file")}</h3>
            <p>{importError(error, lang)}</p>
          </div>
        ) : glb ? (
          <ModelView buffer={glb} capture={capture} onError={fail} />
        ) : (
          <div className="drawing-preview">
            <img
              src={svgUrl}
              alt={t("CAD зургийн урьдчилсан харагдац", "CAD drawing preview")}
              style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
            />
            <div className="drawing-zoom">
              <button
                onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                aria-label="Zoom out"
              >
                −
              </button>
              <span>{zoom * 100}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="import-guidance">
        <Move size={17} />
        <p>
          {glb
            ? t(
                "Чирж эргүүлнэ · Scroll / pinch хийж ойртуулна. Одоо харагдаж буй өнцөг рендерийн эх зураг болно.",
                "Drag to orbit · Scroll / pinch to zoom. The current camera becomes the render source.",
              )
            : t(
                "CAD зургийн Model space дахь геометр. Масштабтай зураг нь хэмжээсийн баталгаат баримт болохгүй.",
                "Model-space geometry. This preview is not a certified dimensioned drawing.",
              )}
        </p>
      </div>
      {!loading && !error && (
        <div className="import-review">
          <AlertTriangle size={17} />
          <p>
            {t(
              "Шалгаж баталгаажуулна уу: бүх фасад, давхарга, цонх, блок зөв харагдаж байна уу? Гаднын холбоос, зарим 3D solid болон annotation дутуу байж болно.",
              "Review all facades, layers, windows and blocks. External references, some 3D solids and annotations may be missing.",
            )}
            {warning && (
              <strong>
                {" "}
                {t("Дэмжигдээгүй элемент: ", "Unsupported elements: ")}
                {warning}
              </strong>
            )}
          </p>
        </div>
      )}
      <footer>
        <span className="import-private">
          <ShieldCheck size={15} />
          {t(
            "Импорт үнэгүй · Эх файл төхөөрөмж дээр үлдэнэ",
            "Free import · Original stays on your device",
          )}
        </span>
        <div>
          {!loading && !error && (
            <label className="import-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              {t("Харагдацыг шалгасан", "I reviewed the view")}
            </label>
          )}
          <button
            className="button dark"
            disabled={loading || !!error || !confirmed || saving}
            onClick={accept}
          >
            {saving ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}{" "}
            {t("Энэ харагдацыг ашиглах", "Use this view")}
          </button>
        </div>
      </footer>
    </dialog>
  );
}
