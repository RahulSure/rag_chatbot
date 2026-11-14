import type { Metadata } from "next";
import { GangaApp } from "@/components/ganga/GangaApp";

export const metadata: Metadata = {
  title: "Ganga — Float a Diya, Find Friends on the Path",
  description: "Write what is in your heart and float it on the river. Each day the Ganga brings you diyas from sadhaks whose Moon and numbers are friends with yours.",
};

export default function GangaPage() {
  return <GangaApp />;
}
