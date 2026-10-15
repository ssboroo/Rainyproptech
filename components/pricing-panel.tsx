"use client";
import { Coins, Check, ArrowUpRight } from "lucide-react";
import { creditPacks } from "@/lib/pricing";
import type { PriceQuote } from "@/lib/pricing";
export function PricingPanel({
  lang,
  image,
  video,
}: {
  lang: "mn" | "en";
  image?: PriceQuote;
  video?: PriceQuote;
}) {
  const t = (mn: string, en: string) => (lang === "mn" ? mn : en);
  return (
    <section id="pricing" className="pricing-section">
      <div className="pricing-heading">
        <div>
          <span className="eyebrow">SIMPLE, TRANSPARENT PRICING</span>
          <h2>
            {t("Төсөв тань. Таны хяналтад.", "Your budget. Your control.")}
          </h2>
          <p>
            {t(
              "1 кредит = 100₮. Загвар, нягтаршил, хугацаагаар тооцно.",
              "1 credit = ₮100. Priced by model, resolution and duration.",
            )}
          </p>
        </div>
        <Coins size={32} />
      </div>
      <div className="pricing-examples">
        {(
          [
            ["image", image],
            ["video", video],
          ] as const
        ).map(([kind, q]) => (
          <div key={kind}>
            <span>
              {kind === "image"
                ? t("Сонгосон AI рендер", "Selected AI render")
                : t("Сонгосон дрон видео", "Selected drone video")}
            </span>
            <strong>
              {q
                ? `${q.credits} ${t("кредит", "credits")} · ${q.totalMnt.toLocaleString()}₮`
                : t("Үнийг баталгаажуулж байна", "Price review pending")}
            </strong>
            <small>
              {q
                ? `${q.modelName} · ${q.resolution}${q.duration ? ` · ${q.duration}s` : ""}`
                : t(
                    "Үнэ баталгаажсан загвар сонгоно уу",
                    "Choose a model with reviewed pricing",
                  )}
            </small>
          </div>
        ))}
      </div>
      <div className="managed-billing">
        <Coins size={20} />
        <div>
          <strong>
            {t(
              "Нэг бүртгэл. Нэг кредитийн үлдэгдэл.",
              "One account. One credit balance.",
            )}
          </strong>
          <p>
            {t(
              "Та сайтын кредитээрээ зураг, видео үүсгэнэ. AI үйлчилгээний холболтыг платформ хариуцна — хувийн API түлхүүр шаардахгүй.",
              "Generate images and videos with site credits. The platform manages the AI provider connection; no personal API key is needed.",
            )}
          </p>
        </div>
      </div>
      <div className="credit-packs">
        {creditPacks.map((pack, i) => (
          <article className={i === 1 ? "featured" : ""} key={pack.name}>
            <span>{pack.name}</span>
            {i === 1 && (
              <small className="pack-badge">
                {t("СТУДИОД ТОХИРОМЖТОЙ", "FOR STUDIOS")}
              </small>
            )}
            <h3>
              {pack.credits.toLocaleString()}{" "}
              <small>{t("кредит", "credits")}</small>
            </h3>
            <strong>{pack.priceMnt.toLocaleString()}₮</strong>
            <p>
              <Check size={14} />
              {t("Рендер + видео, хүссэнээрээ", "Use for renders and videos")}
            </p>
            <p>
              <Check size={14} />
              {t(
                "Үүсгэхийн өмнө үнэ тодорхой",
                "See the price before generating",
              )}
            </p>
            <p>
              <Check size={14} />
              {t(
                "Баталгаатай бүтэлгүйтвэл буцаана",
                "Confirmed failures are refunded",
              )}
            </p>
            <div className="pack-status">
              {t(
                "Админ баталгаажуулж цэнэглэнэ",
                "Administrator-assisted top-up",
              )}
              <ArrowUpRight size={14} />
            </div>
          </article>
        ))}
      </div>
      <p className="pricing-footnote">
        {t(
          "Эдгээр нь цэнэглэх багцын үнийн санал. Онлайн төлбөр одоогоор холбогдоогүй. Дахин шинэ рендер үүсгэх бүр тусдаа төлбөртэй; ижил хүсэлтийг дахин шалгахад давхар суутгахгүй.",
          "These are proposed top-up packs. Online checkout is not connected yet. Each new generation is charged separately; retrying the same request does not double-charge.",
        )}{" "}
        {t(
          "Үнийн шинэчлэл: 2026.10.15.",
          "Pricing reviewed: October 15, 2026.",
        )}
      </p>
    </section>
  );
}
