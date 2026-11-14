"use client";

import { useCallback, useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID, loadGoogleIdentity, useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";

/** Google's "G", in its brand colours (required on custom sign-in buttons). */
function GoogleG({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * Sign-in button drawn in the site's own style. Google's real button (an iframe, which
 * can't be restyled) is rendered on top at zero opacity, so the click still goes to
 * Google and opens its account chooser — no change to the sign-in flow.
 *
 * Renders nothing when sign-in isn't configured, while the session is being checked,
 * or once signed in.
 */
export function GoogleSignInButton({ full = false }: { full?: boolean }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { user, loading, error } = useAuth();
  const { lang, t } = useLanguage();
  const visible = !!GOOGLE_CLIENT_ID && !loading && !user;

  const renderGoogleButton = useCallback(
    (isCancelled: () => boolean = () => false) =>
      loadGoogleIdentity()
        .then((id) => {
          const el = overlayRef.current;
          if (isCancelled() || !el || !wrapRef.current) return;
          el.innerHTML = "";
          // Google's button is at least 200px wide; the overflow is clipped by the wrapper.
          const width = Math.min(400, Math.max(200, Math.ceil(wrapRef.current.offsetWidth)));
          id.renderButton(el, { type: "standard", size: "large", text: "signin", locale: lang === "hi" ? "hi" : "en", width });
        })
        .catch(() => undefined),
    [lang]
  );

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    renderGoogleButton(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [visible, renderGoogleButton]);

  // If Google's script didn't load (flaky network, blocker), a click lands here instead
  // of on Google's button: try again rather than doing nothing.
  const retryIfMissing = () => {
    if (!overlayRef.current?.querySelector("iframe")) renderGoogleButton();
  };

  if (!visible) return null;

  return (
    <div className={full ? "w-full" : ""}>
      <div
        ref={wrapRef}
        className={`group relative overflow-hidden rounded-lg ${full ? "flex w-full" : "inline-flex"}`}
      >
        {/* What people see — matches the language and theme toggles beside it */}
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gold/20 px-3
                      text-sm text-cosmic-300 transition-colors group-hover:border-gold/50 group-hover:text-gold
                      group-focus-within:border-gold/60 group-focus-within:text-gold ${full ? "h-11 w-full text-base" : ""}`}
        >
          <GoogleG size={full ? 18 : 15} />
          <span className="whitespace-nowrap">{t("auth.signIn")}</span>
        </span>
        {/* What receives the click — Google's button, invisible. color-scheme stops the
            browser painting an opaque white box behind the iframe on the dark theme. */}
        <div
          ref={overlayRef}
          onClick={retryIfMissing}
          className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:light]"
          aria-label={t("auth.signIn")}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
