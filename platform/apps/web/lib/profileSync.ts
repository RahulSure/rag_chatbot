/**
 * Mirrors a few localStorage items to the signed-in user's account, so birth
 * details, the chosen city and the japa counter follow them across devices.
 *
 * localStorage stays the source the tools read from; this only copies it up
 * (debounced) while signed in, and on sign-in pulls the account's copy down.
 * Visitors who never sign in are unaffected.
 */

import { getProfile, updateProfile, type ProfileData } from "./api";

type Item = "birth" | "place" | "japa";

const STORAGE_KEYS: Record<Item, string> = {
  birth: "sadhak_birth",
  place: "sadhak_today_place",
  japa: "sadhak_japa",
};

// The japa counter saves on every bead, so wait for a pause before uploading.
const DELAY_MS: Record<Item, number> = { birth: 500, place: 500, japa: 2000 };

/** Fired on window after sign-in sync wrote the account's data into localStorage. */
export const PROFILE_SYNCED_EVENT = "sadhak:profile-synced";

let enabled = false;
const timers: Partial<Record<Item, ReturnType<typeof setTimeout>>> = {};

export function setProfileSyncEnabled(on: boolean) {
  enabled = on;
  if (!on) for (const item of Object.keys(timers) as Item[]) clearTimeout(timers[item]);
}

/** Queue an upload of one item. No-op unless signed in. */
export function pushProfile(item: Item, value: unknown) {
  if (!enabled) return;
  clearTimeout(timers[item]);
  timers[item] = setTimeout(() => {
    updateProfile({ [item]: value } as Partial<ProfileData>).catch(() => undefined);
  }, DELAY_MS[item]);
}

function readLocal(item: Item): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[item]);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(item: Item, value: unknown) {
  try {
    localStorage.setItem(STORAGE_KEYS[item], JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/**
 * On sign-in: items the account already has win and are written into this browser;
 * items only this browser has are uploaded to the account.
 */
export async function syncOnSignIn(): Promise<void> {
  const server = await getProfile().catch(() => null);
  if (!server) return;

  const upload: Partial<ProfileData> = {};
  let wroteLocal = false;
  for (const item of Object.keys(STORAGE_KEYS) as Item[]) {
    const remote = server[item];
    if (remote) {
      writeLocal(item, remote);
      wroteLocal = true;
    } else {
      const local = readLocal(item);
      if (local) (upload as Record<string, unknown>)[item] = local;
    }
  }

  if (Object.keys(upload).length) await updateProfile(upload).catch(() => undefined);
  if (wroteLocal) window.dispatchEvent(new Event(PROFILE_SYNCED_EVENT));
}
