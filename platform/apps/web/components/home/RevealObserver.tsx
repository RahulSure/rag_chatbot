"use client";

import { useEffect } from "react";
import s from "./home.module.css";

/** Adds the "in" class to each rising element once it scrolls into view (the CSS keeps it visible without JS). */
export function RevealObserver() {
  useEffect(() => {
    const items = document.querySelectorAll(`.${s.rise}`);
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add(s.in));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add(s.in);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
