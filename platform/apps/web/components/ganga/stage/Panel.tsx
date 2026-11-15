"use client";

/** A sheet that slides in from the river's edge, for letters and the sadhak's own diyas. */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useLanguage, type Key } from "@/lib/i18n";

export function Panel({ title, onClose, children }: { title: Key; onClose: () => void; children: React.ReactNode }) {
  const { t } = useLanguage();
  return (
    <motion.div className="absolute inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.aside
        role="dialog" aria-modal="true" aria-label={t(title)}
        className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-background sm:w-[30rem]"
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-serif text-2xl">{t(title)}</h2>
          <button type="button" onClick={onClose} aria-label={t("ganga.stage.close")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-cosmic-400 hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
      </motion.aside>
    </motion.div>
  );
}
