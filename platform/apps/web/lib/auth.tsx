"use client";

/**
 * Optional Google sign-in.
 *
 * Google's own button (Google Identity Services) hands us an ID token; the API
 * verifies it and sets an httpOnly session cookie. This context only tracks who
 * is signed in. Without NEXT_PUBLIC_GOOGLE_CLIENT_ID the button is hidden and
 * the site works exactly as before.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, loginWithGoogle, logout, type User } from "./api";
import { setProfileSyncEnabled, syncOnSignIn } from "./profileSync";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

// ── Google Identity Services (loaded once, no npm dependency) ────────────────

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleId {
  initialize(config: { client_id: string; callback: (r: GoogleCredentialResponse) => void; auto_select?: boolean }): void;
  renderButton(el: HTMLElement, options: Record<string, unknown>): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let gisPromise: Promise<GoogleId> | null = null;
let credentialHandler: (credential: string) => void = () => undefined;

/** Load the GIS script and initialise it once; every button shares one callback. */
export function loadGoogleIdentity(): Promise<GoogleId> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<GoogleId>((resolve, reject) => {
    const ready = () => {
      const id = window.google!.accounts.id;
      id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r) => credentialHandler(r.credential) });
      resolve(id);
    };
    if (window.google?.accounts?.id) return ready();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = ready;
    script.onerror = () => {
      gisPromise = null;
      reject(new Error("Could not load Google Sign-In"));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  /** True until we know whether a session exists. */
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMe().then((u) => {
      if (cancelled) return;
      setUser(u);
      setProfileSyncEnabled(!!u);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Google calls this after the user picks an account.
  useEffect(() => {
    credentialHandler = async (credential: string) => {
      setError(null);
      try {
        const u = await loginWithGoogle(credential);
        setProfileSyncEnabled(true);
        await syncOnSignIn();
        setUser(u);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Sign-in failed");
      }
    };
  }, []);

  const signOut = useCallback(async () => {
    setProfileSyncEnabled(false);
    await logout();
    window.google?.accounts.id.disableAutoSelect();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, error, signOut }), [user, loading, error, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
