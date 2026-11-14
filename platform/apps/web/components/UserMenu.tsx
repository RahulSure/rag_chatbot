"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { History, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import type { User } from "@/lib/api";

function initials(user: User) {
  const source = user.name || user.email;
  return source.trim().charAt(0).toUpperCase();
}

export function Avatar({ user, size = 32 }: { user: User; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (user.picture && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny remote avatar; next/image adds nothing here
      <img
        src={user.picture}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="rounded-full border border-gold/30 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-full border border-gold/50 font-serif text-gold"
      style={{ width: size, height: size }}
    >
      {initials(user)}
    </span>
  );
}

/** Avatar button with a small menu: who is signed in, chat history, sign out. */
export function UserMenu() {
  const { user, signOut } = useAuth();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("auth.account")}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar user={user} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-cosmic">
          <div className="border-b border-line px-3 pb-3 pt-2">
            {user.name && <p className="truncate text-sm text-foreground">{user.name}</p>}
            <p className="truncate text-xs text-cosmic-400">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            href="/chat?history=1"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-cosmic-200 transition-colors hover:bg-gold/10 hover:text-foreground"
          >
            <History size={15} aria-hidden="true" /> {t("auth.history")}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-cosmic-200 transition-colors hover:bg-gold/10 hover:text-foreground"
          >
            <LogOut size={15} aria-hidden="true" /> {t("auth.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
