"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity, useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "./ThemeProvider";

/**
 * Google's own sign-in button, shown as it is.
 *
 * It must stay visible: Google protects the button against clickjacking and ignores
 * clicks on it when it is transparent or covered, so a hidden button under a styled
 * label never signs anyone in. Its dark style is used on the night theme and the
 * outline style on the light one, so it still sits well in the navbar.
 *
 * Renders nothing when sign-in isn't configured, while the session is being checked,
 * or once signed in.
 */
export function GoogleSignInButton({ full = false }: { full?: boolean }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const { user, loading, error } = useAuth();
  const { lang, t } = useLanguage();
  const { choice } = useTheme();
  const [failed, setFailed] = useState(false);
  const visible = !!GOOGLE_CLIENT_ID && !loading && !user;

  const render = useCallback(
    (isCancelled: () => boolean = () => false) =>
      loadGoogleIdentity()
        .then((id) => {
          const el = slotRef.current;
          if (isCancelled() || !el) return;
          setFailed(false);
          el.innerHTML = "";
          const dark = document.documentElement.classList.contains("dark");
          id.renderButton(el, {
            type: "standard",
            theme: dark ? "filled_black" : "outline",
            size: full ? "large" : "medium",
            shape: "pill",
            text: "signin",
            logo_alignment: "left",
            locale: lang === "hi" ? "hi" : "en",
            ...(full ? { width: Math.min(400, Math.max(200, el.offsetWidth)) } : {}),
          });
        })
        .catch(() => !isCancelled() && setFailed(true)),
    [lang, full]
  );

  // Draw again when the language or theme changes, so the button matches the page.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    render(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [visible, render, choice]);

  if (!visible) return null;

  return (
    <div className={full ? "w-full" : ""}>
      {/* Google draws its button into this slot; the reserved height keeps the navbar from jumping.
          color-scheme: light stops the browser painting an opaque white box behind Google's frame on the dark theme. */}
      <div ref={slotRef} aria-label={t("auth.signIn")}
           className={`flex items-center [color-scheme:light] ${full ? "min-h-11 w-full" : "min-h-8"}`} />
      {failed && (
        // Google's script was blocked (a content blocker, or no network): say so instead of showing nothing.
        <button type="button" onClick={() => render()} className="text-xs text-cosmic-400 underline-offset-2 hover:text-gold hover:underline">
          {t("auth.signIn")} ↻
        </button>
      )}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
