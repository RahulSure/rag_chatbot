import { T, type Key } from "@/lib/i18n";

/** The centred label, serif title and lead that open every tool page. */
export function ToolHeader({ label, title, lead, children }: { label: Key; title: Key; lead: Key; children: React.ReactNode }) {
  return (
    <div className="min-h-screen px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center sm:mb-12">
          <p className="label-caps">
            <T k={label} />
          </p>
          <h1 className="mb-4 mt-4 font-serif text-4xl text-foreground sm:text-6xl">
            <T k={title} />
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cosmic-300">
            <T k={lead} />
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
