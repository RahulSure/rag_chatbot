"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeChoice } from "./ThemeProvider";
import { useT } from "@/lib/i18n";

const ORDER: ThemeChoice[] = ["system", "light", "dark"];
const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

/** Cycles system → light → dark. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { choice, setChoice } = useTheme();
  const t = useT();
  const next = ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
  const Icon = ICONS[choice];
  const label =
    choice === "light" ? t("nav.themeLight") : choice === "dark" ? t("nav.themeDark") : t("nav.themeSystem");

  return (
    <button
      type="button"
      onClick={() => setChoice(next)}
      aria-label={`${t("nav.theme")}: ${label}`}
      title={`${t("nav.theme")}: ${label}`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gold/20
                  text-cosmic-300 transition-colors hover:border-gold/50 hover:text-gold ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}
