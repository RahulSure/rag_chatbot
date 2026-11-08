"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MessageCircle, RotateCcw } from "lucide-react";
import { matchKundli, type BirthDetails, type Koota, type MatchResult } from "@/lib/api";
import { useLanguage, type Lang } from "@/lib/i18n";
import { KOOTAS, TARAS, graha, say, sign } from "@/lib/jyotish-text";
import { GANA_HI } from "@/lib/nakshatras";
import { BirthForm } from "@/components/kundli/BirthForm";

const VALUE_HI: Record<string, string> = {
  Brahmin: "ब्राह्मण", Kshatriya: "क्षत्रिय", Vaishya: "वैश्य", Shudra: "शूद्र",
  Chatushpada: "चतुष्पद", Manava: "मानव", Jalachara: "जलचर", Vanachara: "वनचर", Keeta: "कीट",
  Horse: "अश्व", Elephant: "गज", Sheep: "मेष", Serpent: "सर्प", Dog: "श्वान", Cat: "मार्जार", Rat: "मूषक",
  Cow: "गौ", Buffalo: "महिष", Tiger: "व्याघ्र", Deer: "मृग", Monkey: "वानर", Mongoose: "नकुल", Lion: "सिंह",
  Adi: "आदि", Madhya: "मध्य", Antya: "अंत्य", ...GANA_HI,
};
const TARA_NAMES = Object.keys(TARAS);

function value(k: Koota, v: string | number, lang: Lang) {
  if (k.koota === "Tara") return say(TARAS[TARA_NAMES[Number(v) - 1]].name, lang);
  if (k.koota === "Graha Maitri") return graha(String(v), lang);
  if (k.koota === "Bhakoot") return String(v);
  return lang === "hi" ? VALUE_HI[String(v)] ?? String(v) : String(v);
}

function Dial({ total }: { total: number }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" className="h-48 w-48" aria-hidden="true">
      <circle cx="90" cy="90" r={r} fill="none" strokeWidth="10" className="stroke-surface-2" />
      <circle cx="90" cy="90" r={r} fill="none" strokeWidth="10" strokeLinecap="round" className="stroke-gold"
              strokeDasharray={`${(total / 36) * c} ${c}`} transform="rotate(-90 90 90)" />
      <text x="90" y="86" textAnchor="middle" className="fill-foreground font-serif text-[44px]">{total}</text>
      <text x="90" y="112" textAnchor="middle" className="fill-cosmic-500 text-[13px]">/ 36</text>
    </svg>
  );
}

export function MatchingApp() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [step, setStep] = useState<"groom" | "bride" | "result">("groom");
  const [groom, setGroom] = useState<BirthDetails | null>(null);
  const [bride, setBride] = useState<BirthDetails | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (b: BirthDetails) => {
    if (!groom) return;
    setBride(b);
    setBusy(true);
    setError("");
    try {
      setResult(await matchKundli(groom, b));
      setStep("result");
    } catch {
      setError(t("kundli.error"));
    } finally {
      setBusy(false);
    }
  };

  if (step !== "result" || !result) {
    return (
      <div className="mx-auto max-w-xl">
        <ol className="mb-6 flex items-center justify-center gap-3 text-sm">
          {(["groom", "bride"] as const).map((s, i) => (
            <li key={s} className={`flex items-center gap-2 ${step === s ? "text-gold" : "text-cosmic-500"}`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-full border ${step === s ? "border-gold" : "border-line"}`}>{i + 1}</span>
              {t(s === "groom" ? "match.groomCol" : "match.brideCol")}
            </li>
          ))}
        </ol>
        <p className="label-caps mb-3 text-center text-[0.7rem]">{t(step === "groom" ? "match.groom" : "match.bride")}</p>
        {step === "groom" ? (
          <BirthForm key="groom" idPrefix="groom" initial={groom} busy={false} submitLabel={t("match.next")}
                     onSubmit={(d) => { setGroom(d); setStep("bride"); }} />
        ) : (
          <>
            <BirthForm key="bride" idPrefix="bride" initial={bride} busy={busy} submitLabel={t("match.submit")} onSubmit={run} />
            <button type="button" onClick={() => setStep("groom")} className="mt-4 inline-flex items-center gap-1.5 text-sm text-cosmic-400 hover:text-gold">
              <ArrowLeft size={14} aria-hidden="true" /> {t("match.back")}
            </button>
          </>
        )}
        {error && <p role="alert" className="mt-3 text-center text-sm text-red-700 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  const total = result.total;
  const verdict = total >= 32 ? "match.v_excellent" : total >= 25 ? "match.v_good" : total >= 18 ? "match.v_average" : "match.v_low";
  const d = result.doshas;
  const doshaLine = (present: boolean, cancelled: boolean) => (cancelled ? t("match.cancelledShort") : present ? t("match.presentShort") : "");
  const names = `${groom?.name || t("match.groomCol")} & ${bride?.name || t("match.brideCol")}`;
  const q = hi
    ? `कुंडली मिलान में ${total}/36 गुण मिले।${d.nadi.present ? " नाड़ी दोष है।" : ""}${d.bhakoot.present ? " भकूट दोष है।" : ""} वर का नक्षत्र ${result.groom.birth_nakshatra.name_hi}, वधू का ${result.bride.birth_nakshatra.name_hi}। इस विवाह के लिए क्या सलाह है और कौन सी साधना सहायक होगी?`
    : `Our kundli matching scored ${total}/36.${d.nadi.present ? " There is Nadi dosha." : ""}${d.bhakoot.present ? " There is Bhakoot dosha." : ""} The groom's nakshatra is ${result.groom.birth_nakshatra.name} and the bride's is ${result.bride.birth_nakshatra.name}. What do you advise for this marriage, and which sadhana would help?`;

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-6 rounded-2xl border border-gold/40 bg-surface p-6 text-center sm:flex-row sm:p-8 sm:text-left">
        <Dial total={total} />
        <div>
          <p className="label-caps text-[0.68rem]">{names}</p>
          <h2 className="mt-2 font-serif text-4xl text-foreground">{t(verdict)}</h2>
          <p className="mt-1 text-cosmic-400">{total} {t("match.score")}</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-cosmic-300">{t("match.verdictNote")}</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-cosmic-500">
            <tr>
              <th className="pb-3 font-medium">{t("match.koota")}</th>
              <th className="pb-3 font-medium">{t("match.groomCol")}</th>
              <th className="pb-3 font-medium">{t("match.brideCol")}</th>
              <th className="pb-3 text-right font-medium">{t("match.points")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {result.kootas.map((k) => (
              <tr key={k.koota}>
                <td className="py-3 pr-3">
                  <p className="font-medium text-foreground">{say(KOOTAS[k.koota].name, lang)}</p>
                  <p className="text-xs text-cosmic-500">{say(KOOTAS[k.koota].about, lang)}</p>
                </td>
                <td className="py-3 pr-3 text-cosmic-200">{value(k, k.groom, lang)}</td>
                <td className="py-3 pr-3 text-cosmic-200">{value(k, k.bride, lang)}</td>
                <td className="py-3 text-right">
                  <span className={`font-serif text-lg lining-nums ${k.points === 0 ? "text-red-700 dark:text-red-300" : "text-foreground"}`}>{k.points}</span>
                  <span className="text-cosmic-500"> / {k.max}</span>
                  <div className="ml-auto mt-1 h-1 w-20 rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-gold" style={{ width: `${(k.points / k.max) * 100}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="label-caps text-[0.68rem]">{t("match.nadiDosha")} · {t("match.bhakootDosha")}</p>
          {!d.nadi.present && !d.bhakoot.present ? (
            <p className="mt-3 text-cosmic-200">{t("match.noDosha")}</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-cosmic-200">
              {d.nadi.present && <li>{t("match.nadiDosha")}: {doshaLine(d.nadi.present, d.nadi.cancelled)}</li>}
              {d.bhakoot.present && <li>{t("match.bhakootDosha")}: {doshaLine(d.bhakoot.present, d.bhakoot.cancelled)}</li>}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="label-caps text-[0.68rem]">{t("kt.mangal")}</p>
          <ul className="mt-3 space-y-1.5 text-cosmic-200">
            {(["groom", "bride"] as const).map((who) => {
              const m = result.mangal[who];
              return (
                <li key={who}>
                  {t(who === "groom" ? "match.groomCol" : "match.brideCol")}:{" "}
                  <span className={m.effective ? "text-red-700 dark:text-red-300" : "text-foreground"}>
                    {m.effective ? t("kt.manglik") : m.manglik ? t("kt.cancelled") : t("kt.notManglik")}
                  </span>
                  <span className="text-cosmic-500"> · {sign(result[who].moon_sign.sign, lang)}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-cosmic-400">{result.mangal.balanced ? t("match.balanced") : t("match.unbalanced")}</p>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href={`/chat?q=${encodeURIComponent(q)}`} className="btn-gold">
          <MessageCircle size={16} aria-hidden="true" /> {t("match.ask")}
        </Link>
        <button type="button" onClick={() => { setResult(null); setStep("groom"); }} className="btn-ghost">
          <RotateCcw size={15} aria-hidden="true" /> {t("match.again")}
        </button>
      </div>
    </div>
  );
}
