"use client";
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
import { Button } from "@/components/ui/button";
import { browserDb } from "@/lib/browser";
import {
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
};
export default function Studio() {
  const db = useMemo(() => browserDb(), []);
  const [lang, setLang] = useState<"mn" | "en">("mn");
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  const [mode, setMode] = useState<"interior" | "exterior">("exterior"),
    [project, setProject] = useState<Project>("exterior_facade"),
    [style, setStyle] = useState<Style>("modern_glass"),
    [motion, setMotion] = useState<Motion>("drone_pull_back");
  const [notes, setNotes] = useState(""),
    [brand, setBrand] = useState("RAINY PROPERTIES"),
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
        setMode(full.project_subtype === "interior" ? "interior" : "exterior");
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
    <div className="studio-shell">
      <header className="topbar">
        <a className="logo" href="/">
          <span className="logo-mark">
            <Layers3 size={23} />
          </span>
          <span>
            RAINY<span className="logo-light"> / PROPTECH</span>
            <small>ARCHITECTURE STUDIO</small>
          </span>
        </a>
        <div className="header-center">
          <span className="live-dot" />
          {t("Санаанаас бодит дүрслэл рүү", "From concept to reality")}
        </div>
        <div className="header-actions">
          <button
            className="language"
            onClick={() => setLang(lang === "mn" ? "en" : "mn")}
          >
            <Globe2 size={15} />
            {lang === "mn" ? "MN" : "EN"}
          </button>
          <span className="credit-pill">
            <Sparkles size={14} />
            {credits} {t("кредит", "credits")}
          </span>
          <Button
            onClick={() => (user ? db?.auth.signOut() : setAuthOpen(true))}
            className="small secondary"
          >
            {user ? <LogOut size={15} /> : t("Нэвтрэх", "Sign in")}
          </Button>
        </div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
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
          <section>
            <label className="section-label">
              <span>01</span>
              {t("Төслийн төрөл", "Project type")}
            </label>
            <div className="project-grid">
              {(mode === "interior"
                ? ["interior"]
                : ["exterior_facade", "master_plan", "townhouse", "commercial"]
              ).map((p) => {
                const key = p as Project;
                const Icon =
                  key === "master_plan"
                    ? Map
                    : key === "townhouse" || key === "interior"
                      ? House
                      : key === "commercial"
                        ? PanelTop
                        : Building2;
                return (
                  <button
                    key={key}
                    disabled={!!active || busy}
                    aria-pressed={project === key}
                    className={
                      "project-card " + (project === key ? "selected" : "")
                    }
                    onClick={() => {
                      setProject(key);
                      setRender(null);
                      setVideo(null);
                      pendingId.current = null;
                    }}
                  >
                    <Icon size={22} />
                    <span>{projects[key][lang]}</span>
                    {project === key && <Check size={12} className="tick" />}
                  </button>
                );
              })}
            </div>
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
              accept="image/png,image/jpeg,image/webp"
              disabled={busy || !!active}
              onChange={(e) => choose(e.target.files?.[0])}
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
                {source
                  ? source.name
                  : t("Зураг оруулах", "Upload source image")}
              </strong>
              <small>
                {t(
                  "Фасад · SketchUp · Талбайн зураг",
                  "Elevation · SketchUp · Site photo",
                )}
              </small>
              <small>PNG, JPG, WebP · max 15 MB</small>
            </button>
            <p className="hint">
              {t(
                "CAD / вектор зургаа эхлээд PNG эсвэл JPG болгон экспортлоно уу.",
                "Export CAD / vector drawings to PNG or JPG first.",
              )}
            </p>
          </section>
          <section>
            <label className="section-label">
              <span>03</span>
              {t("Архитектурын хэв маяг", "Architectural style")}
            </label>
            <div className="styles">
              {(mode === "interior"
                ? ["interior_modern"]
                : [
                    "modern_glass",
                    "neo_classic_building",
                    "eco_residential",
                    "commercial_tower",
                  ]
              ).map((s) => {
                const key = s as Style;
                return (
                  <button
                    key={key}
                    disabled={!!active || busy}
                    className={style === key ? "selected" : ""}
                    aria-pressed={style === key}
                    onClick={() => {
                      setStyle(key);
                      setRender(null);
                      setVideo(null);
                      pendingId.current = null;
                    }}
                  >
                    <span
                      className="swatch"
                      style={{ background: styles[key].color }}
                    />
                    <span>{styles[key][lang]}</span>
                    <span className="radio">{style === key && <span />}</span>
                  </button>
                );
              })}
            </div>
          </section>
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
              <b>2 {t("кредит", "credits")}</b>
            </div>
            <Button
              className="primary"
              disabled={busy || !!active}
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
            <span className="secure-caption">
              <ShieldCheck size={12} />
              {t("Эх зургийг зөвхөн та үзнэ", "Private source drawings")}
            </span>
          </div>
        </aside>
        <main className="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">EXTERIOR & MASTER PLAN EDITION</div>
              <h1>
                {t("Төсөөллөө бодит болго.", "Bring your vision to life.")}
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
                AI POWERED<small>4K RENDER / CINEMATIC VIDEO</small>
              </span>
            </div>
          </div>
          <ol
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
                      ? t("2 кредит · 4K хүсэлт", "2 credits · 4K requested")
                      : t("6 кредит · 5 секунд", "6 credits · 5 seconds")}
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
          <div className="canvas-panel">
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
                <div className="welcome-canvas">
                  <Architecture />
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
                    CONCEPT MASSING / ILLUSTRATION
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
          <section className="drone-section">
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
                5 SEC / 6 {t("КРЕДИТ", "CREDITS")}
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
                disabled={!ready || busy || !!active}
                onClick={() => generate("video")}
              >
                <Video size={17} />
                {t("Дрон видео бүтээх", "Create drone tour")}
                <ArrowUpRight size={16} />
              </Button>
            </div>
          </section>
          <section className="history-section">
            <div className="history-heading">
              <h3>
                <Clock3 size={16} />
                {t("Сүүлийн бүтээлүүд", "Recent creations")}
              </h3>
              {user && (
                <button onClick={() => refresh()} aria-label="Refresh history">
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
            {history.length ? (
              <div className="history-grid">
                {history.map((g) => (
                  <button key={g.id} onClick={() => selectJob(g)}>
                    {g.kind === "image" && g.output_url ? (
                      <img src={g.output_url} alt="Previous render" />
                    ) : (
                      <span className="history-placeholder">
                        {g.kind === "video" ? <Video /> : <ImageIcon />}
                      </span>
                    )}
                    <span>
                      {g.project_subtype
                        ? projects[g.project_subtype]?.[lang]
                        : g.kind}
                      <small>
                        {g.status} · {g.kind === "image" ? 2 : 6} cr
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="history-empty">
                {t(
                  "Эхний бүтээлээ эндээс үргэлжлүүлэн хөгжүүлээрэй.",
                  "Your creative journey starts with the first render.",
                )}
              </p>
            )}
          </section>
          <footer className="main-footer">
            <span>RAINY PROPTECH © 2026</span>
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
            <Layers3 size={32} />
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
function Architecture() {
  return (
    <svg
      className="architecture"
      viewBox="0 0 1000 600"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" stroke="#ccd6ce" strokeWidth=".5" />
        </pattern>
        <linearGradient id="face" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d4ded4" />
          <stop offset="1" stopColor="#a0b6aa" />
        </linearGradient>
      </defs>
      <rect width="1000" height="600" fill="url(#grid)" />
      <g transform="translate(390 65)">
        <path
          d="M-140 410L270 540L580 340L170 220Z"
          fill="#d9e2d6"
          stroke="#94aa9e"
        />
        <path
          d="M50 55L250 0L385 70V380L185 445L50 375Z"
          fill="url(#face)"
          stroke="#78988c"
        />
        <path d="M50 55L185 125L385 70M185 125V445" stroke="#78988c" />
        <path
          d="M-80 220L50 180L150 230V425L20 470L-80 420Z"
          fill="#c3d3c5"
          stroke="#78988c"
        />
        <path d="M-80 220L20 270L150 230M20 270V470" stroke="#78988c" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i} stroke="#78988c" opacity=".7">
            <path
              d={`M50 ${85 + i * 32}L185 ${155 + i * 32}L385 ${100 + i * 32}`}
            />
            <path d={`M185 ${145 + i * 32}L385 ${90 + i * 32}`} />
          </g>
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <path
            key={i}
            d={`M${205 + i * 23} ${120 - i * 6.5}V${438 - i * 7.5}`}
            stroke="#78988c"
            opacity=".65"
          />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <path
            key={i}
            d={`M-80 ${250 + i * 34}L20 ${300 + i * 34}L150 ${260 + i * 34}`}
            stroke="#78988c"
            opacity=".65"
          />
        ))}
        <path
          d="M450 235L510 215L550 238V355L490 380L450 360Z"
          fill="#c3d3c5"
          stroke="#78988c"
        />
        <path d="M450 235L490 258L550 238M490 258V380" stroke="#78988c" />
        {[-90, 200, 420].map((x, i) => (
          <g key={x} transform={`translate(${x} ${450 - i * 32})`}>
            <path d="M0 0V-30" stroke="#819c83" />
            <ellipse cy="-37" rx="18" ry="24" fill="#a2b99b" opacity=".8" />
          </g>
        ))}
      </g>
    </svg>
  );
}
