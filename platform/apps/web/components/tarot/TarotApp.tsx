"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, RotateCcw } from "lucide-react";
import { useLanguage, type Key } from "@/lib/i18n";
import { DECK, cardById, shuffled, text, type TarotCard } from "@/lib/tarot";

type Mode = "day" | "spread";

// The day's card is kept for the whole day, so the visitor is not tempted to redraw for a better one.
const DAY_KEY = "sadhak_tarot_day";
const DAY_FAN = 7;
const SPREAD_FAN = 12;
const POSITIONS: Key[] = ["tarot.past", "tarot.present", "tarot.ahead"];

const localDate = () => new Date().toLocaleDateString("en-CA");

function loadDayCard(): TarotCard | null {
  try {
    const saved = JSON.parse(localStorage.getItem(DAY_KEY) ?? "null") as { date: string; id: string } | null;
    return saved && saved.date === localDate() ? cardById(saved.id) ?? null : null;
  } catch {
    return null;
  }
}

/** The back of every card: our own pattern in night and gold. */
function CardBack() {
  return (
    <svg viewBox="0 0 116 200" aria-hidden="true" className="h-full w-full">
      <rect x="0.5" y="0.5" width="115" height="199" rx="7" fill="#17131f" stroke="#c8a96e" strokeOpacity="0.7" />
      <rect x="7" y="7" width="102" height="186" rx="4" fill="none" stroke="#c8a96e" strokeOpacity="0.45" />
      <g transform="translate(58 100)" fill="none" stroke="#c8a96e" strokeOpacity="0.85" strokeWidth="1">
        <circle r="30" />
        <circle r="22" strokeOpacity="0.5" />
        <rect x="-17" y="-17" width="34" height="34" />
        <rect x="-17" y="-17" width="34" height="34" transform="rotate(45)" />
        <circle r="4" fill="#c8a96e" />
      </g>
      <g fill="#c8a96e" fillOpacity="0.7">
        {[[58, 30], [58, 170], [22, 100], [94, 100]].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y - 4}l4 4-4 4-4-4Z`} />
        ))}
      </g>
    </svg>
  );
}

/** A card that turns over a moment after it appears. */
function FlipCard({ card, priority = false }: { card: TarotCard; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 40);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className={`tarot-flip aspect-[320/553] w-full ${open ? "is-open" : ""}`}>
      <div className="tarot-flip-inner">
        <div className="tarot-face"><CardBack /></div>
        <div className="tarot-face tarot-face-front overflow-hidden rounded-lg border border-gold/40 shadow-cosmic">
          <Image src={card.image} alt={card.name} width={320} height={553} priority={priority} className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

function Fan({ count, hidden, onPick, label }: { count: number; hidden: number[]; onPick: (i: number) => void; label: string }) {
  return (
    <ul className={`mx-auto grid max-w-4xl gap-2 sm:gap-3 ${count > 7 ? "grid-cols-6 sm:grid-cols-12" : "grid-cols-7"}`}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className={hidden.includes(i) ? "invisible" : ""}>
          <button
            type="button"
            onClick={() => onPick(i)}
            aria-label={`${label} ${i + 1}`}
            className="block aspect-[116/200] w-full rounded-lg transition-transform hover:-translate-y-1.5 focus-visible:-translate-y-1.5"
          >
            <CardBack />
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TarotApp() {
  const { lang, t } = useLanguage();
  const hi = lang === "hi";
  const [mode, setMode] = useState<Mode>("day");
  const [deck, setDeck] = useState<TarotCard[] | null>(null);
  const [dayCard, setDayCard] = useState<TarotCard | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [question, setQuestion] = useState("");

  // Shuffle on the client only: the server render shows the deck face down either way.
  useEffect(() => {
    setDeck(shuffled(DECK));
    setDayCard(loadDayCard());
  }, []);

  const pickDay = (i: number) => {
    if (!deck) return;
    const card = deck[i];
    setDayCard(card);
    try {
      localStorage.setItem(DAY_KEY, JSON.stringify({ date: localDate(), id: card.id }));
    } catch {
      /* the card still shows; it just won't be kept for the day */
    }
  };

  // The spread draws from cards the day fan never shows.
  const spreadCards = deck ? deck.slice(DAY_FAN, DAY_FAN + SPREAD_FAN) : [];
  const chosen = picked.map((i) => spreadCards[i]);
  const pickSpread = (i: number) => setPicked((p) => (p.length < 3 && !p.includes(i) ? [...p, i] : p));
  const again = () => {
    setDeck(shuffled(DECK));
    setPicked([]);
  };

  const names = (cards: TarotCard[]) => cards.map((c, i) => `${t(POSITIONS[i])}: ${c.name}`).join(", ");
  const askDay = dayCard && (hi
    ? `आज टैरो में मुझे ${dayCard.name} कार्ड मिला, जिसका संदेश है: ${dayCard.keywords[1]}। मैं इसे अपने दिन और अपनी साधना में कैसे उतारूँ?`
    : `I drew ${dayCard.name} as my tarot card for today. Its message is ${dayCard.keywords[0].toLowerCase()}. How can I bring this into my day and my sadhana?`);
  const askSpread = chosen.length === 3 && (hi
    ? `मैंने तीन कार्ड की टैरो रीडिंग की${question.trim() ? `, प्रश्न था "${question.trim()}"` : ""}। ${names(chosen)}। यह रीडिंग मेरे और मेरी साधना के लिए क्या सुझाती है?`
    : `I did a three-card tarot reading${question.trim() ? ` about "${question.trim()}"` : ""}. ${names(chosen)}. What does this reading suggest for me and my sadhana?`);

  return (
    <div>
      <div role="tablist" aria-label={t("tarot.title")} className="mx-auto mb-12 flex w-fit rounded-full border border-line bg-surface p-1">
        {(["day", "spread"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full px-5 py-2 text-sm transition-colors ${mode === m ? "bg-gold text-background" : "text-cosmic-300 hover:text-foreground"}`}
          >
            {t(m === "day" ? "tarot.tabDay" : "tarot.tabSpread")}
          </button>
        ))}
      </div>

      {mode === "day" && (
        dayCard ? (
          <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="mx-auto w-full max-w-[280px]">
              <FlipCard key={dayCard.id} card={dayCard} priority />
            </div>
            <div>
              <p className="label-caps">{t("tarot.today")}</p>
              <h2 className="mt-3 font-serif text-4xl text-foreground sm:text-5xl">{dayCard.name}</h2>
              <p className="mt-3 text-gold">{text(dayCard.keywords, lang)}</p>
              <p className="mt-5 text-lg leading-relaxed text-cosmic-200">{text(dayCard.meaning, lang)}</p>
              {askDay && (
                <Link href={`/chat?q=${encodeURIComponent(askDay)}`} className="btn-gold mt-8">
                  <MessageCircle size={16} aria-hidden="true" /> {t("tarot.askCard")}
                </Link>
              )}
              <p className="mt-5 text-sm text-cosmic-500">{t("tarot.comeBack")}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="mx-auto mb-8 max-w-md text-lg text-cosmic-300">{t("tarot.pickOne")}</p>
            <Fan count={DAY_FAN} hidden={[]} onPick={pickDay} label={t("tarot.cardBack")} />
          </div>
        )
      )}

      {mode === "spread" && (
        <div>
          {chosen.length < 3 && (
            <div className="mx-auto mb-10 max-w-md">
              <label htmlFor="tarot-q" className="label-caps mb-2 block text-[0.7rem]">{t("tarot.question")}</label>
              <input
                id="tarot-q"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t("tarot.questionHint")}
                className="w-full rounded-lg border border-line bg-surface-2 px-4 py-3 text-base text-foreground placeholder:text-cosmic-500 focus:border-gold/60 focus:outline-none"
              />
            </div>
          )}

          <ol className="mx-auto grid max-w-4xl grid-cols-3 gap-3 sm:gap-8">
            {POSITIONS.map((k, i) => (
              <li key={k}>
                <p className="label-caps mb-3 text-center text-[0.68rem]">{t(k)}</p>
                <div className="mx-auto w-full max-w-[220px]">
                  {chosen[i] ? (
                    <FlipCard key={chosen[i].id} card={chosen[i]} />
                  ) : (
                    <div className="aspect-[320/553] w-full rounded-lg border border-dashed border-gold/30" />
                  )}
                </div>
                {chosen.length === 3 && (
                  <div className="mt-4 text-center sm:text-left">
                    <h3 className="font-serif text-lg text-foreground sm:text-2xl">{chosen[i].name}</h3>
                    <p className="mt-1 text-xs text-gold sm:text-sm">{text(chosen[i].keywords, lang)}</p>
                    <p className="mt-2 hidden text-sm leading-relaxed text-cosmic-300 sm:block">{text(chosen[i].meaning, lang)}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>

          {chosen.length < 3 ? (
            <div className="mt-12 text-center">
              <p className="mb-6 text-cosmic-300">
                {t("tarot.pickThree")} <span className="text-cosmic-500">({chosen.length} / 3 {t("tarot.chosen")})</span>
              </p>
              <Fan count={SPREAD_FAN} hidden={picked} onPick={pickSpread} label={t("tarot.cardBack")} />
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-4xl">
              {/* On phones the three meanings read as a list under the cards. */}
              <dl className="space-y-4 sm:hidden">
                {chosen.map((c, i) => (
                  <div key={c.id} className="rounded-xl border border-line bg-surface p-4">
                    <dt className="label-caps text-[0.68rem]">{t(POSITIONS[i])} · {c.name}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-cosmic-200">{text(c.meaning, lang)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {askSpread && (
                  <Link href={`/chat?q=${encodeURIComponent(askSpread)}`} className="btn-gold">
                    <MessageCircle size={16} aria-hidden="true" /> {t("tarot.askSpread")}
                  </Link>
                )}
                <button type="button" onClick={again} className="btn-ghost">
                  <RotateCcw size={15} aria-hidden="true" /> {t("tarot.again")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mx-auto mt-16 max-w-xl space-y-2 border-t border-line pt-8 text-center text-xs leading-relaxed text-cosmic-500">
        <p>{t("tarot.note")}</p>
        <p>{t("tarot.deck")}</p>
      </div>
    </div>
  );
}
