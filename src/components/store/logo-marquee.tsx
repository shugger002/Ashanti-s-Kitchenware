const marks = [
  { id: "hearth", label: "Hearth" },
  { id: "lidco", label: "Lid & Co" },
  { id: "forge", label: "Forge" },
  { id: "grain", label: "Grain" },
  { id: "kettle", label: "Kettle" },
  { id: "table", label: "Table" },
  { id: "stove", label: "Stove" },
  { id: "rack", label: "Rack" },
] as const;

function Wordmark({ id, label }: { id: string; label: string }) {
  const className = "h-10 w-auto max-w-[9.5rem] text-white md:h-11";
  switch (id) {
    case "hearth":
      return (
        <svg viewBox="0 0 160 36" className={className} aria-hidden>
          <text x="0" y="28" fill="currentColor" fontFamily="Georgia, serif" fontSize="28" letterSpacing="4">
            HEARTH
          </text>
        </svg>
      );
    case "lidco":
      return (
        <svg viewBox="0 0 150 36" className={className} aria-hidden>
          <text x="0" y="26" fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="20" fontWeight="300">
            LID &amp; CO
          </text>
        </svg>
      );
    case "forge":
      return (
        <svg viewBox="0 0 140 36" className={className} aria-hidden>
          <text
            x="0"
            y="28"
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
            fontSize="26"
            fontWeight="700"
            letterSpacing="-1"
          >
            FORGE
          </text>
        </svg>
      );
    case "grain":
      return (
        <svg viewBox="0 0 130 36" className={className} aria-hidden>
          <text x="0" y="28" fill="currentColor" fontFamily="Georgia, serif" fontSize="26" fontStyle="italic">
            Grain
          </text>
        </svg>
      );
    case "kettle":
      return (
        <svg viewBox="0 0 150 36" className={className} aria-hidden>
          <text x="0" y="26" fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="18" letterSpacing="6">
            KETTLE
          </text>
        </svg>
      );
    case "table":
      return (
        <svg viewBox="0 0 120 36" className={className} aria-hidden>
          <text x="0" y="28" fill="currentColor" fontFamily="Georgia, serif" fontSize="30">
            table
          </text>
        </svg>
      );
    case "stove":
      return (
        <svg viewBox="0 0 140 36" className={className} aria-hidden>
          <text x="0" y="27" fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="600">
            STOVE
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 110 36" className={className} aria-hidden>
          <text x="0" y="26" fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="22" letterSpacing="3">
            {label.toUpperCase()}
          </text>
        </svg>
      );
  }
}

export function LogoMarquee() {
  const loop = [...marks, ...marks];
  return (
    <section className="overflow-hidden bg-accent py-10 text-white md:py-12" aria-label="Example brand logos">
      <style>{`
        @keyframes ak-logo-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        [data-logo-marquee] {
          animation: ak-logo-marquee 38s linear infinite;
        }
        [data-logo-marquee-wrap]:hover [data-logo-marquee] {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-logo-marquee] { animation: none; }
        }
      `}</style>
      <p className="text-center font-serif text-2xl md:text-3xl">Example brands</p>
      <p className="mx-auto mt-2 max-w-xl px-5 text-center text-xs leading-relaxed text-white/75">
        Layout samples for the ticker. Not press mentions, and not a list of brands the Accra shop sells. Swap these for
        official marks of names you actually stock.
      </p>
      <div
        data-logo-marquee-wrap
        className="mt-8 overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <ul data-logo-marquee className="flex w-max">
          {loop.map((mark, index) => (
            <li
              key={`${mark.id}-${index}`}
              className="flex h-14 w-[11rem] shrink-0 items-center justify-center px-8 md:w-[13rem]"
              aria-hidden={index >= marks.length}
            >
              {index < marks.length ? <span className="sr-only">{mark.label}</span> : null}
              <Wordmark id={mark.id} label={mark.label} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
