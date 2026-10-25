/** Every free tool, grouped the way the menu, the tools page and the home page show them. */

import type { Key } from "./i18n";

export interface Tool {
  href: string;
  title: Key;
  desc: Key;
}

export const TOOL_GROUPS: { title: Key; tools: Tool[] }[] = [
  {
    title: "tools.chart",
    tools: [
      { href: "/kundli", title: "v4.toolKundli", desc: "v4.toolKundliDesc" },
      { href: "/matching", title: "v4.toolMatching", desc: "tools.matchingDesc" },
      { href: "/kundli?tab=vargas", title: "kt.vargas", desc: "tools.vargasDesc" },
      { href: "/kundli?tab=ishta", title: "kt.ishta", desc: "tools.ishtaDesc" },
      { href: "/kundli?tab=mangal", title: "kt.mangal", desc: "tools.mangalDesc" },
      { href: "/kundli?tab=ashtaka", title: "kt.ashtaka", desc: "tools.ashtakaDesc" },
      { href: "/kundli?tab=reports", title: "kt.reports", desc: "tools.reportsDesc" },
      { href: "/varshaphal", title: "tools.varsha", desc: "tools.varshaDesc" },
      { href: "/kundli?tab=western", title: "kt.western", desc: "tools.westernDesc" },
    ],
  },
  {
    title: "tools.daily",
    tools: [
      { href: "/my-day", title: "day.label", desc: "tools.dayDesc" },
      { href: "/#today", title: "v4.toolPanchang", desc: "v4.toolPanchangDesc" },
      { href: "/muhurat", title: "mu.nav", desc: "mu.navDesc" },
      { href: "/calendar", title: "cal.label", desc: "tools.calDesc" },
      { href: "/nakshatra", title: "nak.label", desc: "tools.nakDesc" },
    ],
  },
  {
    title: "tools.readings",
    tools: [
      { href: "/numerology", title: "v4.toolNumerology", desc: "v4.toolNumerologyDesc" },
      { href: "/tarot", title: "v4.toolTarot", desc: "v4.toolTarotDesc" },
      { href: "/palm", title: "palm.label", desc: "tools.palmDesc" },
      { href: "/switch-words", title: "sw.label", desc: "tools.swDesc" },
    ],
  },
  {
    title: "tools.practice",
    tools: [
      { href: "/japa", title: "tools.japaShort", desc: "tools.japaDesc" },
      { href: "/vastu", title: "vastu.label", desc: "tools.vastuDesc" },
      { href: "/chat", title: "nav.chat", desc: "tools.askDesc" },
    ],
  },
];
