"use client";

import { useEffect, useState } from "react";
import { gangaApi } from "@/lib/api";

/** Tells everyone showing the unread count to look again (after a thread is read). */
export const GANGA_UNREAD_EVENT = "sadhak:ganga-unread";

/** Letter threads with something new for this sadhak; checked on each page change. 0 when signed out. */
export function useGangaUnread(signedIn: boolean, pathname: string) {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!signedIn) {
      setUnread(0);
      return;
    }
    let live = true;
    const check = () => gangaApi.me().then((r) => live && setUnread(r.unread ?? 0)).catch(() => undefined);
    check();
    window.addEventListener(GANGA_UNREAD_EVENT, check);
    return () => {
      live = false;
      window.removeEventListener(GANGA_UNREAD_EVENT, check);
    };
  }, [signedIn, pathname]);
  return unread;
}
