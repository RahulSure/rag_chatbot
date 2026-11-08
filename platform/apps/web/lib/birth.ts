/** The visitor's own birth details, kept in this browser only and shared by the kundli tools. */

import type { BirthDetails } from "./api";

const STORAGE_KEY = "sadhak_birth";

export function loadBirth(): BirthDetails | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BirthDetails) : null;
  } catch {
    return null;
  }
}

export function saveBirth(details: BirthDetails) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
  } catch {
    /* storage unavailable: the reading still shows, it just won't be remembered */
  }
}
