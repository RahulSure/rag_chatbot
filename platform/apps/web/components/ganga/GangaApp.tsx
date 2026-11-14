"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { gangaApi, type GangaProfile } from "@/lib/api";
import { GOOGLE_CLIENT_ID, useAuth } from "@/lib/auth";
import { useLanguage, type Key } from "@/lib/i18n";
import { CatchList } from "./CatchList";
import { FloatForm } from "./FloatForm";
import { JoinForm } from "./JoinForm";
import { Letters } from "./Letters";
import { MyDiyas } from "./MyDiyas";
import { RiverScene } from "./RiverScene";
import { ErrorNote, codeOf } from "./shared";
import { useGangaUnread } from "./unread";

type Tab = "river" | "float" | "mine" | "letters";
const TABS: { id: Tab; label: Key }[] = [
  { id: "river", label: "ganga.tabRiver" },
  { id: "float", label: "ganga.tabFloat" },
  { id: "mine", label: "ganga.tabMine" },
  { id: "letters", label: "ganga.tabLetters" },
];

const STEPS: { n: string; title: Key; body: Key }[] = [
  { n: "१", title: "ganga.how1Title", body: "ganga.how1Body" },
  { n: "२", title: "ganga.how2Title", body: "ganga.how2Body" },
  { n: "३", title: "ganga.how3Title", body: "ganga.how3Body" },
];

function HowItWorks() {
  const { t } = useLanguage();
  return (
    <ol className="grid gap-6 sm:grid-cols-3 sm:gap-8">
      {STEPS.map((s) => (
        <li key={s.n} className="border-t border-gold/40 pt-4">
          <p className="font-serif text-3xl text-gold" aria-hidden="true">{s.n}</p>
          <h2 className="mt-1 font-serif text-2xl">{t(s.title)}</h2>
          <p className="mt-2 leading-relaxed text-cosmic-300">{t(s.body)}</p>
        </li>
      ))}
    </ol>
  );
}

/** Signed-in sadhak with a place on the river: today's diyas, floating one, their own, and letters. */
function River({ profile, onEdit, onLeft }: { profile: GangaProfile; onEdit: () => void; onLeft: () => void }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const unread = useGangaUnread(true, pathname);
  const [tab, setTab] = useState<Tab>("river");
  const [thread, setThread] = useState<string | null>(null);
  const [floated, setFloated] = useState(0);

  const openThread = (id: string | null) => {
    setThread(id);
    setTab("letters");
  };

  async function leave() {
    if (!window.confirm(t("ganga.leaveConfirm"))) return;
    await gangaApi.leave().catch(() => undefined);
    onLeft();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-cosmic-300">
          {t("ganga.signedAs")} <span className="font-serif text-xl text-gold">{profile.name}</span>
        </p>
        <div className="flex gap-4 text-sm">
          <button type="button" onClick={onEdit} className="text-cosmic-300 hover:text-foreground">{t("ganga.edit")}</button>
          <button type="button" onClick={leave} className="text-cosmic-500 hover:text-foreground">{t("ganga.leave")}</button>
        </div>
      </div>

      <div role="tablist" aria-label={t("ganga.label")} className="mt-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((tb) => (
          <button key={tb.id} type="button" role="tab" id={`tab-${tb.id}`} aria-selected={tab === tb.id} aria-controls="ganga-panel"
                  onClick={() => { setTab(tb.id); if (tb.id === "letters") setThread(null); }}
                  className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors sm:px-4 sm:text-base ${tab === tb.id ? "border-gold text-foreground" : "border-transparent text-cosmic-400 hover:text-foreground"}`}>
            {t(tb.label)}
            {tb.id === "letters" && unread > 0 && (
              <span className="rounded-full bg-gold px-1.5 text-xs font-semibold text-background lining-nums">{unread}</span>
            )}
          </button>
        ))}
      </div>

      <div id="ganga-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
        {tab === "river" && <CatchList onOpenThread={openThread} />}
        {tab === "float" && <FloatForm onFloated={() => setFloated((n) => n + 1)} />}
        {tab === "mine" && <MyDiyas version={floated} />}
        {tab === "letters" && <Letters open={thread} onOpen={(id) => setThread(id)} />}
      </div>
    </div>
  );
}

export function GangaApp() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<GangaProfile | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    gangaApi.me().then((r) => setProfile(r.profile)).catch((e) => setError(codeOf(e)));
  }, []);
  useEffect(() => {
    if (user) load();
    else setProfile(undefined);
  }, [user, load]);

  let body: React.ReactNode;
  if (loading || (user && profile === undefined && !error)) {
    body = <p className="text-center text-cosmic-400">{t("ganga.loading")}</p>;
  } else if (!user) {
    body = (
      <div className="space-y-12">
        <HowItWorks />
        <div className="mx-auto max-w-xl rounded-2xl border border-gold/40 bg-surface p-6 text-center sm:p-8">
          <h2 className="font-serif text-3xl">{t("ganga.signInTitle")}</h2>
          <p className="mt-3 leading-relaxed text-cosmic-300">{t("ganga.signInBody")}</p>
          <div className="mt-6 flex justify-center">
            {GOOGLE_CLIENT_ID ? <GoogleSignInButton full /> : <p className="text-sm text-cosmic-500">{t("ganga.noSignIn")}</p>}
          </div>
        </div>
      </div>
    );
  } else if (error) {
    body = <div className="mx-auto max-w-xl"><ErrorNote code={error} /></div>;
  } else if (!profile || editing) {
    body = (
      <JoinForm current={profile ?? null} onCancel={profile ? () => setEditing(false) : undefined}
                onSaved={(p) => { setProfile(p); setEditing(false); }} />
    );
  } else {
    body = <River profile={profile} onEdit={() => setEditing(true)} onLeft={() => setProfile(null)} />;
  }

  // A sadhak already on the river comes back for today's diyas: keep the intro short.
  const onRiver = !!user && !!profile && !editing;
  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <header className={`text-center ${onRiver ? "mb-6" : "mb-8 sm:mb-10"}`}>
          <p className="label-caps">{t("ganga.label")}</p>
          <h1 className={`mt-4 font-serif text-foreground ${onRiver ? "text-3xl sm:text-5xl" : "mb-4 text-4xl sm:text-6xl"}`}>{t("ganga.title")}</h1>
          {!onRiver && <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cosmic-300">{t("ganga.lead")}</p>}
        </header>
        <div className={`overflow-hidden rounded-2xl border border-line ${onRiver ? "mb-8 h-28 sm:h-44 lg:h-52" : "mb-10 h-48 sm:mb-14 sm:h-64 lg:h-[340px]"}`}>
          <RiverScene />
        </div>
        {body}
      </div>
    </div>
  );
}
