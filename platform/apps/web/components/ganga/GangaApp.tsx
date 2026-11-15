"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { gangaApi, type GangaProfile } from "@/lib/api";
import { GOOGLE_CLIENT_ID, useAuth } from "@/lib/auth";
import { useLanguage, type Key } from "@/lib/i18n";
import { JoinForm } from "./JoinForm";
import { RiverScene } from "./RiverScene";
import { ErrorNote, codeOf } from "./shared";
import { RiverStage } from "./stage/RiverStage";

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

  // On the river itself the whole screen is the stage.
  if (user && profile && !editing && !error) {
    return <RiverStage profile={profile} onEdit={() => setEditing(true)} onLeft={() => setProfile(null)} />;
  }

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
  } else {
    body = (
      <JoinForm current={profile ?? null} onCancel={profile ? () => setEditing(false) : undefined}
                onSaved={(p) => { setProfile(p); setEditing(false); }} />
    );
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center sm:mb-10">
          <p className="label-caps">{t("ganga.label")}</p>
          <h1 className="mb-4 mt-4 font-serif text-4xl text-foreground sm:text-6xl">{t("ganga.title")}</h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cosmic-300">{t("ganga.lead")}</p>
        </header>
        <div className="mb-10 h-48 overflow-hidden rounded-2xl border border-line sm:mb-14 sm:h-64 lg:h-[340px]">
          <RiverScene />
        </div>
        {body}
      </div>
    </div>
  );
}
