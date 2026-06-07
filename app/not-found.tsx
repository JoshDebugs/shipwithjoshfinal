import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh w-full items-center justify-center px-6 md:px-12">
      <div className="grid-bg absolute inset-0 opacity-30" aria-hidden />

      {/* top-left chrome */}
      <div className="absolute top-6 left-6 md:top-8 md:left-12 font-mono text-[11px] uppercase tracking-[0.22em] text-fg-soft">
        shipwithjosh<span className="text-accent">.</span>com
      </div>

      {/* top-right error code */}
      <div className="absolute top-6 right-6 md:top-8 md:right-12 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        err 404 ── path not found
      </div>

      {/* center */}
      <div className="relative z-10 flex max-w-3xl flex-col items-start">
        <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted mb-6">
          // wrong url. right vibe.
        </div>

        <h1 className="text-[clamp(3.5rem,12vw,10rem)] font-medium leading-[0.9] tracking-[-0.045em]">
          lost
          <span className="text-accent">.</span>
          <br />
          same
          <span className="text-accent">.</span>
        </h1>

        <p className="mt-8 max-w-xl text-base md:text-lg text-fg-soft leading-relaxed">
          Whatever you were looking for, it's not here. The homepage is, though
         . and there's a lot more interesting stuff on it anyway.
        </p>

        <Link
          href="/"
          className="group mt-10 inline-flex items-center gap-3 rounded-full border border-line bg-bg-soft px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-fg transition-colors duration-300 hover:border-accent hover:text-accent"
          data-cursor="hover"
        >
          <span>back to the homepage</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            <path
              d="M2 6H10M10 6L6 2M10 6L6 10"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
        </Link>
      </div>

      {/* bottom mono */}
      <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-12 md:right-12 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        <span>// stack trace: you took a wrong turn somewhere.</span>
        <span>shipwithjosh.com / no recovery needed</span>
      </div>
    </main>
  );
}
