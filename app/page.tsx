"use client";
import { heroVisual, visualFor } from "@/lib/visual-catalog";
import { InspirationGallery } from "@/components/inspiration-gallery";
import dynamic from "next/dynamic";
import { PricingPanel } from "@/components/pricing-panel";
import type { PriceQuote } from "@/lib/pricing";
import { PresetLibrary } from "@/components/preset-library";
import { ArchitectureIcon } from "@/components/architecture-icon";
import {
  IMPORT_ACCEPT,
  MODEL_LIMIT,
  sourceFormat,
} from "@/lib/importer/formats";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  House,
  Layers3,
  Map,
  Upload,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Video,
  ImageIcon,
  ScanLine,
  Check,
  Globe2,
  LogOut,
  Download,
  RotateCcw,
  MoveUpRight,
  Orbit,
  PanelTop,
  Loader2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";
import { ResultsGallery } from "@/components/results-gallery";
import { ModelPicker } from "@/components/model-picker";
import { Button } from "@/components/ui/button";
import { browserDb } from "@/lib/browser";
import {
  category,
  projects,
  styles,
  motions,
  Project,
  Style,
  Motion,
} from "@/lib/presets";
type Generation = {
  id: string;
  kind: "image" | "video";
  status: string;
  output_url?: string;
  source_url?: string;
  project_subtype?: Project;
  style_preset?: Style;
  created_at?: string;
  model?: string;
  model_name?: string;
};
const ImportDialog = dynamic(
  () =>
    import("@/components/importer/import-dialog").then((m) => m.ImportDialog),
  { ssr: false },
);
export default function Studio() {
  const db = useMemo(() => browserDb(), []);
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  const [mode, setMode] = useState<"interior" | "exterior">("exterior"),
    [project, setProject] = useState<Project>("exterior_facade"),
    [style, setStyle] = useState<Style>("modern_glass"),
    [motion, setMotion] = useState<Motion>("drone_pull_back");
  const [notes, setNotes] = useState(""),
    [brand, setBrand] = useState("RAINY VISTA"),
    [source, setSource] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [sourceUrl, setSourceUrl] = useState(""),
    [render, setRender] = useState<Generation | null>(null),
    [video, setVideo] = useState<Generation | null>(null),
    [tab, setTab] = useState<"render" | "compare" | "video">("render");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [authOpen, setAuthOpen] = useState(false),
    [user, setUser] = useState(""),
    [credits, setCredits] = useState(0),
    [history, setHistory] = useState<Generation[]>([]),
    [busy, setBusy] = useState(false),
    [active, setActive] = useState<string | null>(null),
    [message, setMessage] = useState(""),
    [drag, setDrag] = useState(false);
  const [routingMode, setRoutingMode] = useState<
    "auto" | "quality" | "speed" | "structure"
  >("auto");
  const [imageModel, setImageModel] = useState(""),
    [videoModel, setVideoModel] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    function close(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExpanded(false);
        setSettingsOpen(false);
      }
    }
    window.addEventListener("keydown", close);
    const lock =
      expanded ||
      (settingsOpen && window.matchMedia("(max-width:760px)").matches);
    const previous = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = previous;
    };
  }, [expanded, settingsOpen]);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingId = useRef<string | null>(null);
  const api = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const session = await db?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token)
        throw new Error(
          lang === "mn" ? "Эхлээд нэвтэрнэ үү." : "Please sign in.",
        );
      const r = await fetch(path, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Request failed");
      return body;
    },
    [db, lang],
  );
  const refresh = useCallback(async () => {
    try {
      const a = await api("/api/account");
      setCredits(a.credits);
      setHistory(a.generations);
      const pending = a.generations.find(
        (g: Generation) => !["completed", "failed"].includes(g.status),
      );
      if (pending) setActive(pending.id);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }, [api]);
  useEffect(() => {
    if (!db) return;
    db.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user.email || ""));
    const { data } = db.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user.email || ""),
    );
    return () => data.subscription.unsubscribe();
  }, [db]);
  useEffect(() => {
    if (user) void refresh();
    else {
      setCredits(0);
      setHistory([]);
      setRender(null);
      setVideo(null);
      setActive(null);
    }
  }, [user, refresh]);
  useEffect(() => {
    if (!source) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(source);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);
  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    let errors = 0;
    async function poll() {
      try {
        const g: Generation = await api(`/api/generations/${active}`);
        if (stopped) return;
        errors = 0;
        if (g.kind === "image") {
          setRender(g);
          if (g.source_url) setSourceUrl(g.source_url);
        } else setVideo(g);
        if (g.status === "completed" || g.status === "failed") {
          setActive(null);
          setBusy(false);
          pendingId.current = null;
          setMessage(
            g.status === "failed" ? "Generation failed. Credits refunded." : "",
          );
          void refresh();
          return;
        }
        setMessage(
          t(
            "Таны бүтээлийг боловсруулж байна…",
            "Your generation is processing…",
          ),
        );
      } catch (e) {
        if (stopped) return;
        setMessage((e as Error).message);
        errors++;
        if (errors >= 5) {
          setBusy(false);
          setActive(null);
          setMessage(
            t(
              "Төлөв шалгах түр зогслоо. Түүхээс үргэлжлүүлэн шалгана уу.",
              "Status checks paused. Select this job in history to resume.",
            ),
          );
          return;
        }
      }
      if (!stopped) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [active, api, refresh]); // eslint-disable-line react-hooks/exhaustive-deps
  function choose(file?: File) {
    if (!file) return;
    if (sourceFormat(file.name)) {
      if (!file.size || file.size > MODEL_LIMIT) {
        setMessage(
          t(
            "CAD / SketchUp файл 25 MB хүртэл байна.",
            "CAD / SketchUp files must be under 25 MB.",
          ),
        );
        return;
      }
      setImportFile(file);
      setMessage("");
      return;
    }
    setOriginalName("");
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 15 * 1024 * 1024
    ) {
      setMessage(
        t(
          "PNG, JPG, WebP зураг, 15 MB хүртэл.",
          "Use PNG, JPG or WebP under 15 MB.",
        ),
      );
      return;
    }
    setSource(file);
    setRender(null);
    setVideo(null);
    setSourceUrl("");
    pendingId.current = null;
    setTab("render");
    setMessage("");
  }
  async function loadExample(extension: "dxf" | "skp") {
    try {
      const name = extension === "dxf" ? "facade.dxf" : "building.skp";
      const r = await fetch("/samples/" + name);
      if (!r.ok) throw new Error("Example unavailable");
      choose(new File([await r.blob()], name));
    } catch {
      setMessage(
        t("Жишээ файлыг ачаалж чадсангүй.", "Could not load the example."),
      );
    }
  }
  const pricingSelection = JSON.stringify({
    project,
    motion,
    mode: routingMode,
    image: imageModel,
    video: videoModel,
  });
  const [pricing, setPricing] = useState<{
    selection: string;
    image?: { quote?: PriceQuote; error?: string };
    video?: { quote?: PriceQuote; error?: string };
  }>({ selection: "" });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/pricing?" + new URLSearchParams(JSON.parse(pricingSelection)), {
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error("Price unavailable");
        return r.json();
      })
      .then((d) => setPricing({ ...d, selection: pricingSelection }))
      .catch((e) => {
        if (e.name !== "AbortError")
          setPricing({
            selection: pricingSelection,
            image: { error: "Үнэ ачаалсангүй / Price unavailable" },
            video: { error: "Үнэ ачаалсангүй / Price unavailable" },
          });
      });
    return () => controller.abort();
  }, [pricingSelection]);
  const imageQuote =
    pricing.selection === pricingSelection ? pricing.image?.quote : undefined;
  const videoQuote =
    pricing.selection === pricingSelection ? pricing.video?.quote : undefined;
  async function generate(kind: "image" | "video") {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (busy || active) return;
    if (kind === "image" && !source) {
      fileRef.current?.click();
      return;
    }
    if (kind === "video" && render?.status !== "completed") return;
    const quote = kind === "image" ? imageQuote : videoQuote;
    if (!quote) {
      setMessage(
        t("Үнийг эхлээд баталгаажуулна уу.", "Wait for a verified price."),
      );
      return;
    }
    if (credits < quote.credits) {
      setMessage(
        t(
          `Кредит хүрэлцэхгүй. ${quote.credits} кредит хэрэгтэй.`,
          `Insufficient credits. ${quote.credits} credits required.`,
        ),
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      let path = "";
      if (kind === "image") {
        const form = new FormData();
        form.append("file", source!);
        path = (await api("/api/upload", { method: "POST", body: form })).path;
      }
      const id = pendingId.current || crypto.randomUUID();
      pendingId.current = id;
      const result = await api("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          kind,
          expected_credits: quote.credits,
          pricing_version: quote.version,
          routing_mode: routingMode,
          ...((kind === "image" ? imageModel : videoModel)
            ? { model_id: kind === "image" ? imageModel : videoModel }
            : {}),
          project,
          style,
          motion,
          notes,
          ...(kind === "image"
            ? { source_path: path }
            : { parent_id: render!.id }),
        }),
      });
      setActive(result.id);
      setSettingsOpen(false);
      setTab(kind === "video" ? "video" : "render");
      void refresh();
    } catch (e) {
      setMessage((e as Error).message);
      setBusy(false);
      void refresh();
    }
  }
  async function auth(signup = false) {
    if (!db) {
      setMessage(
        t(
          "Supabase холболтыг тохируулсны дараа нэвтэрнэ.",
          "Configure Supabase to enable sign in.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const { error } = signup
        ? await db.auth.signUp({ email, password })
        : await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthOpen(false);
      setMessage(
        signup
          ? t(
              "Имэйлээ шалгаж бүртгэлээ баталгаажуулна уу.",
              "Check your email to confirm your account.",
            )
          : "",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function selectJob(g: Generation) {
    try {
      const full = await api(`/api/generations/${g.id}`);
      setSource(null);
      setSourceUrl(full.source_url || "");
      if (full.kind === "image") {
        setRender(full);
        setVideo(null);
        setProject(full.project_subtype);
        setStyle(full.style_preset);
        setMode(
          category(full.project_subtype as Project) === "interior"
            ? "interior"
            : "exterior",
        );
        setTab("render");
      } else {
        setVideo(full);
        setTab("video");
      }
      if (!["completed", "failed"].includes(full.status)) setActive(full.id);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  const ready = render?.status === "completed";
  const before = preview || sourceUrl;
  return (
    <div
      className={
        "studio-shell atelier " + (settingsOpen ? "settings-open" : "")
      }
    >
      {importFile && (
        <ImportDialog
          file={importFile}
          lang={lang}
          onClose={() => setImportFile(null)}
          onConfirm={(file, name) => {
            choose(file);
            setOriginalName(name);
            setImportFile(null);
            setSettingsOpen(false);
          }}
        />
      )}
      <header className="topbar">
        <a className="logo" href="/">
          <img className="vista-logo" src="/brand/vista-mark.svg" alt="" />
          <span className="vista-wordmark">
            RAINY <b>VISTA</b>
            <small>ARCHITECTURE IN PERSPECTIVE</small>
          </span>
        </a>
        <nav
          className="header-center studio-nav"
          aria-label={t("Үндсэн цэс", "Main navigation")}
        >
          <a href="#studio">{t("Студио", "Studio")}</a>
          <a href="#results">{t("Бодит үр дүн", "Real results")}</a>
          <a href="#workflow">{t("Хэрхэн ажиллах вэ", "How it works")}</a>
          <a href="#pricing">{t("Үнэ & кредит", "Pricing")}</a>
        </nav>
        <div className="header-actions">
          <button
            className="settings-toggle"
            aria-expanded={settingsOpen}
            aria-controls="project-settings"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <PanelTop size={16} />
            <span>{t("Тохиргоо", "Settings")}</span>
          </button>
          <button
            className="language"
            onClick={() => setLang(lang === "mn" ? "en" : "mn")}
          >
            <Globe2 size={15} />
            {lang === "mn" ? "MN" : "EN"}
          </button>
          <a className="credit-pill" href="#pricing">
            <Sparkles size={14} />
            {credits} {t("кредит", "credits")}
          </a>
          <Button
            onClick={() => (user ? db?.auth.signOut() : setAuthOpen(true))}
            className="small secondary"
          >
            {user ? <LogOut size={15} /> : t("Нэвтрэх", "Sign in")}
          </Button>
        </div>
      </header>
      <div className="workspace">
        <button
          className="settings-scrim"
          aria-label={t("Тохиргоо хаах", "Close settings")}
          onClick={() => setSettingsOpen(false)}
        />
        <aside id="project-settings" className="sidebar">
          <button
            className="settings-close"
            onClick={() => setSettingsOpen(false)}
          >
            {t("Тохиргоог хаах", "Close settings")} ×
          </button>
          <div className="sidebar-title">
            <span>CREATIVE WORKSPACE</span>
            <span>01 — 03</span>
          </div>
          <div className="mode-switch">
            {(["interior", "exterior"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={mode === m}
                disabled={!!active || busy}
                className={mode === m ? "selected" : ""}
                onClick={() => {
                  setMode(m);
                  setProject(m === "interior" ? "interior" : "exterior_facade");
                  setStyle(
                    m === "interior" ? "interior_modern" : "modern_glass",
                  );
                  setRender(null);
                  setVideo(null);
                  pendingId.current = null;
                }}
              >
                {m === "interior" ? (
                  <House size={16} />
                ) : (
                  <Building2 size={16} />
                )}{" "}
                {m === "interior"
                  ? t("Интерьер", "Interior")
                  : t("Барилга & Фасад", "Exterior & site")}
              </button>
            ))}
          </div>
          <section className="preset-control">
            <PresetLibrary
              kind="project"
              mode={mode}
              value={project}
              lang={lang}
              disabled={!!active || busy}
              onChange={(key) => {
                setProject(key as Project);
                setRender(null);
                setVideo(null);
                pendingId.current = null;
              }}
            />
          </section>
          <section>
            <label className="section-label">
              <span>02</span>
              {t("Эх зураг", "Source drawing")}
            </label>
            <input
              ref={fileRef}
              type="file"
              className="sr-only"
              accept={IMPORT_ACCEPT}
              disabled={busy || !!active}
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              className={"upload-zone " + (drag ? "drag" : "")}
              disabled={busy || !!active}
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                if (!busy && !active) choose(e.dataTransfer.files[0]);
              }}
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <img src={preview} alt="Source preview" />
              ) : (
                <Upload size={22} />
              )}
              <strong>
                {source ? source.name : t("Файл оруулах", "Import source file")}
              </strong>
              <small>
                {t(
                  "Фасад · SketchUp · Талбайн зураг",
                  "Elevation · SketchUp · Site photo",
                )}
              </small>
              <span className="file-format-row">
                <b>DWG</b>
                <b>DXF</b>
                <b>SKP</b>
                <b>IMAGE</b>
              </span>
            </button>
            <p className="hint">
              {t(
                "CAD / SKP: 25 MB · Зураг: 15 MB. Файлаа нээгээд харагдацаа баталгаажуулна.",
                "CAD / SKP: 25 MB · Images: 15 MB. Open your file and confirm the source view.",
              )}
            </p>
            <div className="source-examples">
              <span>{t("Файлгүй бол турших:", "Try a source:")}</span>
              <button
                disabled={busy || !!active}
                onClick={() => loadExample("dxf")}
              >
                DXF ↗
              </button>
              <button
                disabled={busy || !!active}
                onClick={() => loadExample("skp")}
              >
                SketchUp ↗
              </button>
            </div>
            {originalName && (
              <div className="imported-source">
                <ArchitectureIcon name="blocks" size={17} />
                <span>
                  <strong>{originalName}</strong>
                  <small>
                    {t("Баталгаажуулсан PNG харагдац", "Confirmed PNG view")}
                  </small>
                </span>
                <button
                  onClick={() => setOriginalName("")}
                  aria-label={t(
                    "Файлын тэмдэглэгээ арилгах",
                    "Clear file label",
                  )}
                >
                  ×
                </button>
              </div>
            )}
          </section>
          <section className="preset-control">
            <PresetLibrary
              kind="style"
              mode={mode}
              value={style}
              lang={lang}
              disabled={!!active || busy}
              onChange={(key) => {
                setStyle(key as Style);
                setRender(null);
                setVideo(null);
                pendingId.current = null;
              }}
            />
          </section>
          <ModelPicker
            lang={lang}
            mode={routingMode}
            image={imageModel}
            video={videoModel}
            disabled={busy || !!active}
            onChange={(m, i, v) => {
              setRoutingMode(m);
              setImageModel(i);
              setVideoModel(v);
              pendingId.current = null;
            }}
          />
          <label className="notes-label">
            {t("Нэмэлт тайлбар", "Additional direction")}
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                pendingId.current = null;
              }}
              maxLength={1500}
              disabled={!!active || busy}
              placeholder={t(
                "Материал, орчин, гэрэлтүүлэг…",
                "Materials, setting, lighting…",
              )}
            />
          </label>
          <div className="sidebar-bottom">
            <div className="cost-row">
              <span>{t("Нэг дүрслэл", "Per render")}</span>
              <b>
                {imageQuote
                  ? `${imageQuote.credits} ${t("кредит", "credits")} · ${imageQuote.totalMnt.toLocaleString()}₮`
                  : t("Үнэ шалгаж байна…", "Checking price…")}
              </b>
            </div>
            <Button
              className="primary"
              disabled={busy || !!active || !imageQuote}
              onClick={() => generate("image")}
            >
              {busy || active ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <Sparkles size={18} />
              )}{" "}
              {t("Дүрслэл бүтээх", "Generate render")}
              <ArrowRight size={17} />
            </Button>
            <p className="quote-detail" role="status">
              {imageQuote
                ? `${imageQuote.modelName} · ${imageQuote.resolution}`
                : pricing.image?.error}
            </p>
            <a className="quote-link" href="#pricing">
              {t(
                "1 кредит = 100₮ · Багц харах",
                "1 credit = ₮100 · View packs",
              )}
            </a>
            <span className="secure-caption">
              <ShieldCheck size={12} />
              {t("Эх зургийг зөвхөн та үзнэ", "Private source drawings")}
            </span>
          </div>
        </aside>
        <main className="main" id="studio">
          <div className="page-heading">
            <div>
              <div className="eyebrow">ARCHITECTURAL WORKSPACE / 01</div>
              <h1>
                {t(
                  "Таны зураг. Шинэ бодит орчин.",
                  "Your drawing. A new reality.",
                )}
              </h1>
              <p>
                {t(
                  "Архитектурын зураг → Бодит дүрслэл → Кино мэт дрон аялал",
                  "Architectural drawing → Photoreal render → Cinematic drone tour",
                )}
              </p>
            </div>
            <div className="edition-badge">
              <ScanLine size={17} />
              <span>
                AI POWERED<small>MULTI-MODEL AI STUDIO</small>
              </span>
            </div>
          </div>
          <ol
            id="workflow"
            className="workflow-steps"
            aria-label={t("Ажлын дараалал", "Workflow")}
          >
            {[
              {
                label: t("Эх зураг", "Source image"),
                done: !!before,
                active: !before,
              },
              {
                label: t("Бодит мэт рендер", "Photoreal render"),
                done: !!ready,
                active: !!before && !ready,
              },
              {
                label: t("Дрон видео", "Drone video"),
                done: video?.status === "completed",
                active: !!ready && video?.status !== "completed",
              },
            ].map((step, i) => (
              <li
                key={i}
                className={step.done ? "done" : step.active ? "current" : ""}
              >
                <span>{step.done ? <Check size={14} /> : i + 1}</span>
                <strong>{step.label}</strong>
                <small>
                  {i === 0
                    ? t("Өөрийн зурагт тулгуурлана", "Based on your drawing")
                    : i === 1
                      ? t(
                          "AI рендер · Үнэ загвараас хамаарна",
                          "AI render · Model-based price",
                        )
                      : t(
                          "AI видео · Хугацаагаар тооцно",
                          "AI video · Priced by duration",
                        )}
                </small>
              </li>
            ))}
          </ol>
          {!db && (
            <div className="config-note">
              {t(
                "Workspace бэлэн. Бодит үүсгэлтэд Supabase болон Fal.ai холболт шаардлагатай.",
                "Workspace ready. Connect Supabase and Fal.ai to enable live generation.",
              )}
            </div>
          )}
          {message && (
            <div role="status" className="status-message">
              {(busy || active) && <Loader2 size={16} className="spin" />}
              {message}
              <button aria-label="Dismiss" onClick={() => setMessage("")}>
                ×
              </button>
            </div>
          )}
          {before && (
            <div className="source-strip">
              <img
                src={before}
                alt={t("Таны оруулсан эх зураг", "Your uploaded source")}
              />
              <div>
                <strong>{t("Таны эх зураг", "Your source drawing")}</strong>
                <small>
                  {t(
                    "Барилгын хэлбэр, давхар, цонхны үндсэн лавлагаа",
                    "Reference for massing, floors and window layout",
                  )}
                </small>
              </div>
              <Button
                className="secondary small"
                disabled={busy || !!active}
                onClick={() => fileRef.current?.click()}
              >
                {t("Зураг солих", "Replace image")}
              </Button>
            </div>
          )}
          <div
            className={"canvas-panel " + (expanded ? "canvas-expanded" : "")}
          >
            <div className="canvas-toolbar">
              <div className="view-tabs">
                <button
                  className={tab === "render" ? "active" : ""}
                  onClick={() => setTab("render")}
                >
                  <ImageIcon size={15} />
                  {ready
                    ? t("AI үр дүн", "AI result")
                    : t("Эх зураг", "Source")}
                </button>
                <button
                  className={tab === "compare" ? "active" : ""}
                  disabled={!ready || !before}
                  title={t(
                    "Рендер бэлэн болсны дараа харьцуулна",
                    "Compare after your render completes",
                  )}
                  onClick={() => setTab("compare")}
                >
                  <ScanLine size={15} />
                  {t("Өмнө / Дараа", "Before / After")}
                </button>
                <button
                  className={tab === "video" ? "active" : ""}
                  onClick={() => setTab("video")}
                >
                  <Video size={15} />
                  Drone Tour
                </button>
              </div>
              <button
                className="expand-canvas"
                aria-pressed={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded
                  ? t("Хаах ×", "Close ×")
                  : t("Томоор үзэх ↗", "Expand ↗")}
              </button>
              <div className="canvas-meta">
                <span className="live-dot" />
                {ready
                  ? t("AI РЕНДЕР БЭЛЭН", "AI RENDER READY")
                  : t("ЭХ ЗУРГИЙН ОРЧИН", "SOURCE WORKSPACE")}
              </div>
            </div>
            <div className="output-canvas">
              {tab === "video" ? (
                video?.status === "completed" && video.output_url ? (
                  <div className="video-wrap">
                    <video
                      key={video.output_url}
                      src={video.output_url}
                      controls
                      playsInline
                    />
                    <div className="brand-overlay">{brand}</div>
                  </div>
                ) : (
                  <div className="empty-video">
                    <Video size={38} />
                    <h2>
                      {t("Кино мэт дрон аялал", "Your cinematic drone tour")}
                    </h2>
                    <p>
                      {t(
                        "Бэлэн дүрслэлээс камерын хөдөлгөөн сонгож видео бүтээнэ.",
                        "Generate a render, then choose a camera move to create your film.",
                      )}
                    </p>
                  </div>
                )
              ) : tab === "compare" && ready && before ? (
                <ReactCompareSlider
                  itemOne={
                    <ReactCompareSliderImage
                      src={before}
                      alt="Original architectural source"
                    />
                  }
                  itemTwo={
                    <ReactCompareSliderImage
                      src={render!.output_url!}
                      alt="AI architectural visualization"
                    />
                  }
                  style={{ width: "100%", height: "100%" }}
                />
              ) : ready && render?.output_url ? (
                <img
                  className="output-image"
                  src={render.output_url}
                  alt="Generated architectural visualization"
                />
              ) : before ? (
                <img
                  className="output-image"
                  src={before}
                  alt="Original architectural drawing"
                />
              ) : (
                <div className="welcome-canvas photographic-welcome">
                  <img
                    className="welcome-photo"
                    src={
                      project === "exterior_facade"
                        ? heroVisual
                        : visualFor("project", project, true)
                    }
                    alt={t(
                      "Архитектурын AI жишээ дүрслэл",
                      "AI architectural concept reference",
                    )}
                    fetchPriority="high"
                  />
                  <div className="welcome-shade" />
                  <div className="canvas-intro">
                    <span className="outline-pill">YOUR NEXT LANDMARK</span>
                    <h2>
                      {t("Томоор төсөөл.", "Think beyond walls.")}
                      <br />
                      <em>
                        {t("Бүхэлд нь бүтээ.", "Design the whole vision.")}
                      </em>
                    </h2>
                    <p>
                      {t(
                        "Нэг фасадаас бүхэл хотхон хүртэл.",
                        "From a single facade to an entire neighborhood.",
                      )}
                    </p>
                    <Button
                      className="canvas-upload"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={16} />
                      {t("Эх зургаа оруулах", "Upload your drawing")}
                      <ArrowUpRight size={16} />
                    </Button>
                  </div>
                  <span className="drawing-caption">
                    AI CONCEPT / RAINY VISTA
                  </span>
                </div>
              )}
              {!ready && before && tab !== "video" && !busy && !active && (
                <div className="source-only-label">
                  <ImageIcon size={14} />
                  <span>
                    {t(
                      "Эх зураг — AI рендер хараахан үүсээгүй",
                      "Original source — no AI render generated yet",
                    )}
                  </span>
                </div>
              )}
              {(busy || active) && (
                <div className="processing">
                  <Loader2 size={26} className="spin" />
                  <span>
                    {t("Боловсруулж байна", "Processing your vision")}
                  </span>
                  <small>
                    {t(
                      "Үүсгэх хугацаа загвар болон дарааллаас хамаарна.",
                      "Generation time depends on model and queue.",
                    )}
                  </small>
                </div>
              )}
              {ready && tab === "compare" && (
                <>
                  <span className="compare-label left">
                    {t("ТАНЫ ЭХ ЗУРАГ", "YOUR SOURCE")}
                  </span>
                  <span className="compare-label right">
                    {t("AI РЕНДЕР", "AI RENDER")}
                  </span>
                </>
              )}
            </div>
            <div className="canvas-footer">
              <span>
                <Layers3 size={14} />
                {projects[project][lang]} <span className="separator">/</span>{" "}
                {styles[style][lang]}
              </span>
              {(tab === "video" ? video?.output_url : render?.output_url) ? (
                <a
                  href={(tab === "video" ? video : render)!.output_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={14} />
                  {t("Файл нээх", "Open file")}
                </a>
              ) : (
                <span>
                  {t("Таны бүтээл энд харагдана", "Your creation appears here")}
                </span>
              )}
            </div>
          </div>
          {ready && (
            <div className="result-guidance">
              <ScanLine size={17} />
              <p>
                <strong>
                  {t(
                    "Эх зурагтайгаа харьцуулж үзээрэй.",
                    "Compare against your source.",
                  )}
                </strong>{" "}
                {t(
                  "Өмнө / Дараа хэсгийн заагийг чирж барилгын хэлбэр, давхар, цонх, тагтыг шалгаад видео бүтээгээрэй.",
                  "Drag the Before / After divider to review massing, floors, windows and balconies before creating your video.",
                )}
              </p>
              <Button
                className="secondary small"
                onClick={() => setTab("compare")}
              >
                {t("Харьцуулах", "Compare")}
              </Button>
            </div>
          )}
          <InspirationGallery
            lang={lang}
            mode={mode}
            onChoose={(p, s) => {
              setProject(p);
              setStyle(s);
              setRender(null);
              setVideo(null);
              pendingId.current = null;
              document
                .getElementById("studio")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            disabled={busy || !!active}
          />
          <section className="drone-section photographic-drone">
            <figure className="drone-photo">
              <img
                src={
                  mode === "interior"
                    ? visualFor("project", project, true)
                    : "/visuals/urban_plan.webp"
                }
                alt={t(
                  "Дроны өнцгийн AI жишээ дүрслэл",
                  "AI aerial concept reference",
                )}
                loading="lazy"
              />
              <figcaption>
                <span>
                  {mode === "interior"
                    ? "THE INTERIOR PERSPECTIVE"
                    : "THE AERIAL PERSPECTIVE"}
                </span>
                <strong>
                  {t("Өөр өнцгөөс хар.", "See the bigger picture.")}
                </strong>
                <small>
                  {t(
                    "AI жишээ зураг · Видео биш",
                    "AI concept still · Not a video",
                  )}
                </small>
              </figcaption>
            </figure>
            <div className="drone-heading">
              <div className="drone-icon">
                <Video size={21} />
              </div>
              <div>
                <div className="eyebrow">THE NEXT PERSPECTIVE</div>
                <h2>
                  {t(
                    "Дүрслэлээ хөдөлгөөнд оруул.",
                    "Set your architecture in motion.",
                  )}
                </h2>
              </div>
              <span className="duration">
                AI VIDEO /{" "}
                {videoQuote
                  ? `${videoQuote.credits} ${t("КРЕДИТ", "CREDITS")}`
                  : t("ҮНЭ ШАЛГАХ", "PRICE CHECK")}
              </span>
            </div>
            <div className="motion-grid">
              {Object.entries(motions).map(([key, m], i) => {
                const Icon = [MoveUpRight, Orbit, ArrowRight][i];
                return (
                  <button
                    className={
                      "motion-card " + (motion === key ? "selected" : "")
                    }
                    key={key}
                    disabled={busy || !!active}
                    onClick={() => {
                      setMotion(key as Motion);
                      pendingId.current = null;
                    }}
                    aria-pressed={motion === key}
                  >
                    <Icon size={23} />
                    <span>
                      <strong>{m[lang]}</strong>
                      <small>
                        {
                          [
                            "PULL BACK + ELEVATE",
                            "SMOOTH ORBIT",
                            "HORIZONTAL TRACKING",
                          ][i]
                        }
                      </small>
                    </span>
                    <span className="radio">{motion === key && <span />}</span>
                  </button>
                );
              })}
            </div>
            <div className="drone-bottom">
              <label>
                {t("Компанийн нэр", "Company branding")}
                <input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  maxLength={60}
                />
              </label>
              <span className="overlay-note">
                {t("Тоглуулагч дээр харагдах брэнд", "Brand overlay in player")}
              </span>
              <Button
                className="dark"
                disabled={!ready || busy || !!active || !videoQuote}
                onClick={() => generate("video")}
              >
                <Video size={17} />
                {t("Дрон видео бүтээх", "Create drone tour")}{" "}
                {videoQuote
                  ? `· ${videoQuote.credits} ${t("кредит", "credits")}`
                  : ""}
                <ArrowUpRight size={16} />
              </Button>
            </div>
          </section>
          <p className="quote-detail" role="status">
            {videoQuote
              ? `${videoQuote.modelName} · ${videoQuote.duration}s · ${videoQuote.totalMnt.toLocaleString()}₮`
              : pricing.video?.error}
          </p>
          {(tab === "video" ? video?.model_name : render?.model_name) && (
            <p className="used-model">
              {t("Ашигласан загвар", "Model used")}:{" "}
              <strong>{(tab === "video" ? video : render)?.model_name}</strong>
            </p>
          )}
          <PricingPanel lang={lang} image={imageQuote} video={videoQuote} />
          <ResultsGallery
            jobs={history}
            lang={lang}
            signedIn={!!user}
            onOpen={(g) => {
              void selectJob(g);
              document
                .getElementById("studio")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            onStart={() =>
              user ? fileRef.current?.click() : setAuthOpen(true)
            }
            onRefresh={() => void refresh()}
          />
          {history.some((g) => g.status !== "completed") && (
            <details className="job-activity">
              <summary>
                <Clock3 size={14} />
                {t("Боловсруулалтын түүх", "Processing activity")}
              </summary>
              {history
                .filter((g) => g.status !== "completed")
                .map((g) => (
                  <button key={g.id} onClick={() => void selectJob(g)}>
                    <span>
                      {g.kind === "image"
                        ? t("Рендер", "Render")
                        : t("Видео", "Video")}
                    </span>
                    <small>{g.status}</small>
                    <ArrowUpRight size={14} />
                  </button>
                ))}
            </details>
          )}
          <footer className="main-footer">
            <span>RAINY VISTA © 2026</span>
            <span>
              {t(
                "Архитектурын шинэ өнцөг.",
                "A new perspective on architecture.",
              )}
            </span>
          </footer>
        </main>
      </div>
      {authOpen && (
        <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
          <form
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              void auth();
            }}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setAuthOpen(false)}
            >
              ×
            </button>
            <img
              src="/brand/vista-mark.svg"
              width={44}
              height={44}
              alt="RAINY VISTA"
            />
            {message && <p role="status">{message}</p>}
            <h2>
              {t(
                "Бүтээлч орон зайдаа нэвтрэх",
                "Enter your creative workspace",
              )}
            </h2>
            <label>
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label>
              {t("Нууц үг", "Password")}
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <Button className="primary" disabled={busy}>
              {t("Нэвтрэх", "Sign in")}
            </Button>
            <Button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => auth(true)}
            >
              {t("Шинээр бүртгүүлэх", "Create account")}
            </Button>
            <small>
              {t(
                "Кредитийг админ баталгаажуулж олгоно.",
                "Credits are provisioned by an administrator.",
              )}
            </small>
          </form>
        </div>
      )}
    </div>
  );
}
