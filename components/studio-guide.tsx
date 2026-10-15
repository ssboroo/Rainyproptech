"use client";
import Link from "next/link";
import {
  Upload,
  Building2,
  Film,
  ShieldCheck,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
export function StudioGuide({
  lang,
  onExample,
}: {
  lang: "mn" | "en";
  onExample: (notes: string) => void;
}) {
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  return (
    <section className="guide-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">RAINY VISTA / GETTING STARTED</span>
          <h1>
            {t(
              "Санаанаас бодит мэт дүрслэл рүү.",
              "From an idea to a photoreal concept.",
            )}
          </h1>
          <p>
            {t(
              "Эх зураг → Монгол орчин → Рендер → Дрон видео.",
              "Reference → Mongolian setting → Render → Drone video.",
            )}
          </p>
        </div>
      </header>
      <div className="guide-steps">
        {[
          [
            Upload,
            "01",
            t("Эх зургаа оруулах", "Upload your reference"),
            t(
              "PNG/JPG/WebP 15 MB хүртэл. DXF, DWG, SketchUp 25 MB хүртэл; нээгээд харагдацаа батална.",
              "PNG/JPG/WebP up to 15 MB. DXF, DWG and SketchUp up to 25 MB; open and confirm the view.",
            ),
          ],
          [
            Building2,
            "02",
            t("Орчин ба хэв маяг", "Set location and style"),
            t(
              "Улаанбаатар, тал нутаг эсвэл хөдөө орчноо сонго. Улирал, материал, гэрлээ тохируул. Давхар, цонх, тагт эх зургаас хадгалагдах ёстой.",
              "Choose Ulaanbaatar, steppe or countryside, then season, materials and light. Floors, windows and balconies should follow the reference.",
            ),
          ],
          [
            Film,
            "03",
            t("Шалгаад хөдөлгөөнд оруулах", "Review, then animate"),
            t(
              "Өмнө/Дараа харьцуулж бүтцийг шалга. Дрон студиод хугацаа, нягтаршил, камер сонгоод нийт кредитээ харж үүсгэнэ.",
              "Compare Before/After. In Drone studio, choose duration, resolution and camera motion, review the credit total and generate.",
            ),
          ],
        ].map(([Icon, n, title, copy]) => {
          const I = Icon as typeof Upload;
          return (
            <article key={String(n)}>
              <span>{String(n)}</span>
              <I size={26} />
              <h2>{String(title)}</h2>
              <p>{String(copy)}</p>
            </article>
          );
        })}
      </div>
      <div className="guide-example">
        <Lightbulb size={24} />
        <div>
          <h2>
            {t("Монгол орчны жишиг тайлбар", "A Mongolian context example")}
          </h2>
          <p>
            {t(
              "Улаанбаатарын орчин үеийн орон сууц. Барилгын давхар, цонх, тагтыг өөрчлөхгүй. Дулаан саарал чулуу, хүрэл металл хүрээ, зуны оройн зөөлөн гэрэл, тухайн уур амьсгалд тохирсон ногоон байгууламж.",
              "A contemporary Ulaanbaatar residence. Keep floors, windows and balconies unchanged. Warm grey stone, bronze frames, soft summer evening light and climate-appropriate landscaping.",
            )}
          </p>
          <button
            onClick={() =>
              onExample(
                "Улаанбаатарын орчин үеийн орон сууц. Барилгын давхар, цонх, тагтыг өөрчлөхгүй. Дулаан саарал чулуу, хүрэл металл хүрээ, зуны оройн зөөлөн гэрэл, Монголын уур амьсгалд тохирсон ногоон байгууламж.",
              )
            }
            type="button"
          >
            {t("Энэ тайлбараар эхлэх", "Use this direction")}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div className="guide-faq">
        <h2>{t("Түгээмэл асуултууд", "Frequently asked questions")}</h2>
        {[
          [
            t("Кредит яаж ажиллах вэ?", "How do credits work?"),
            t(
              "1 кредит = 100₮. Starter 50,000₮ / 500 кредитээс эхэлнэ. Үүсгэхийн өмнө нийт үнэ харагдана. Одоогоор онлайн checkout холбогдоогүй; төлбөрийг админ баталгаажуулж цэнэглэнэ.",
              "1 credit = ₮100. Starter begins at ₮50,000 / 500 credits. You see the total before generating. Online checkout is not connected; an administrator confirms and provisions top-ups.",
            ),
          ],
          [
            t(
              "Нэмэлт AI бүртгэл хэрэгтэй юу?",
              "Do I need another AI account?",
            ),
            t(
              "Үгүй. Сайтын бүртгэл, дотоод кредитээрээ ашиглана. Хувийн API түлхүүр оруулах шаардлагагүй.",
              "No. Use your site account and internal credits. You do not need to supply a personal API key.",
            ),
          ],
          [
            t(
              "10 секунд гэдэг нь бэлэн болох хугацаа юу?",
              "Is 10 seconds the waiting time?",
            ),
            t(
              "Үгүй, энэ нь видеоны үргэлжлэх хугацаа. Загвар, дарааллаас хамаарч боловсруулахад хэдэн минут шаардаж болно.",
              "No. It is the clip length. Processing may take several minutes depending on the model and queue.",
            ),
          ],
          [
            t(
              "Алдаа гарвал кредит яах вэ?",
              "What happens if generation fails?",
            ),
            t(
              "Баталгаатай бүтэлгүй хүсэлтэд кредитийг нэг удаа бүтэн буцаана. Хүлээлгийн хугацаа хэтэрсэн ч хүсэлт хүлээн авсан эсэх нь тодорхойгүй бол давхар үүсгэхгүй, төлөвийг шалгана.",
              "Confirmed failed requests receive one full credit refund. If a timeout leaves acceptance uncertain, the existing request is checked instead of submitting a duplicate.",
            ),
          ],
          [
            t("Барилга яг адил үлдэх үү?", "Will the building stay identical?"),
            t(
              "Эх зургийг бүтцийн үндсэн лавлагаа болгоно. AI нь цонх, давхар эсвэл нарийн деталь өөрчилж болзошгүй тул Өмнө/Дараа шалгана. Энэ нь архитектурын concept дүрслэл; батлагдсан барилгын зураг биш.",
              "The reference governs the structure. AI can still change windows, floors or details, so review Before/After. This is concept visualization, not an approved construction drawing.",
            ),
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <div className="guide-cta">
        <ShieldCheck size={20} />
        <span>
          {t(
            "Өөрийн зураг, бүтээлд зөвхөн та нэвтэрнэ.",
            "Your references and results are private to your account.",
          )}
        </span>
        <Link href="/">
          {t("Студио нээх", "Open studio")}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
