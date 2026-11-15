"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { gangaApi, type GangaProfile } from "@/lib/api";
import { GOOGLE_CLIENT_ID, useAuth } from "@/lib/auth";
import { useLanguage, type Key } from "@/lib/i18n";
import { JoinForm } from "./JoinForm";
import { ErrorNote, codeOf } from "./shared";
import { RiverStage } from "./stage/RiverStage";
import { SceneBackdrop } from "./stage/SceneBackdrop";

const STEPS: { n: string; title: Key; body: Key }[] = [
  { n: "१", title: "ganga.how1Title", body: "ganga.how1Body" },
  { n: "२", title: "ganga.how2Title", body: "ganga.how2Body" },
  { n: "३", title: "ganga.how3Title", body: "ganga.how3Body" },
];

function HowItWorks() {
  const { t } = useLanguage();
  return (
    <ol className="grid gap-5 sm:grid-cols-3 sm:gap-6">
      {STEPS.map((s) => (
        <li key={s.n} className="rounded-2xl border border-[#f3dcae]/20 bg-black/35 p-6 backdrop-blur-md">
          <p className="font-serif text-3xl text-[#f0cf92]" aria-hidden="true">{s.n}</p>
          <h2 className="mt-1 font-serif text-2xl text-[#f6e7c6]">{t(s.title)}</h2>
          <p className="mt-2 leading-relaxed text-[#d9cdb4]">{t(s.body)}</p>
        </li>
      ))}
    </ol>
  );
}

export function GangaApp() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const still = useReducedMotion() ?? false;
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
    body = <p className="text-center text-[#d9cdb4]">{t("ganga.loading")}</p>;
  } else if (!user) {
    body = (
      <div className="space-y-10">
        <HowItWorks />
        <div className="mx-auto max-w-xl rounded-2xl border border-[#f3dcae]/30 bg-black/40 p-6 text-center backdrop-blur-md sm:p-8">
          <h2 className="font-serif text-3xl text-[#f6e7c6]">{t("ganga.signInTitle")}</h2>
          <p className="mt-3 leading-relaxed text-[#d9cdb4]">{t("ganga.signInBody")}</p>
          <div className="mt-6 flex justify-center">
            {GOOGLE_CLIENT_ID ? <GoogleSignInButton full /> : <p className="text-sm text-[#bdb296]">{t("ganga.noSignIn")}</p>}
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
    <div className="ganga-scene relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <SceneBackdrop still={still} />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-[11dvh] sm:px-6">
        <header className="text-center">
          <p className="label-caps !text-[#e2bf84] drop-shadow">{t("ganga.label")}</p>
          <h1 className="ganga-display mx-auto mt-5 max-w-3xl text-5xl leading-[1.14] sm:text-7xl">{t("ganga.title")}</h1>
          <div className="gold-divider" aria-hidden="true" />
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[#ecdfc5] [text-shadow:0_1px_10px_rgb(0_0_0/0.55)]">
            {t("ganga.lead")}
          </p>
        </header>
        <div className="mt-[9dvh]">{body}</div>
      </div>
    </div>
  );
}
