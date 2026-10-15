const marks = [
  { id: "hoffmans", label: "Hoffmans" },
  { id: "silver-crest", label: "Silver Crest" },
  { id: "sokany", label: "Sokany" },
  { id: "igloo", label: "Igloo" },
  { id: "coleman", label: "Coleman" },
  { id: "boma", label: "BOMA" },
  { id: "ninja", label: "Ninja" },
] as const;

function Wordmark({ id, label }: { id: string; label: string }) {
  const className = "h-10 w-auto max-w-[12rem] text-white md:h-11";
  switch (id) {
    case "hoffmans":
      return (
        <svg viewBox="0 0 200 36" className={className} aria-hidden>
          <text
            x="0"
            y="28"
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
            fontSize="24"
            fontWeight="700"
            letterSpacing="-0.5"
          >
            HOFFMANS
          </text>
        </svg>
      );
    case "silver-crest":
      return (
        <svg viewBox="0 0 210 36" className={className} aria-hidden>
          <text x="0" y="28" fill="currentColor" fontFamily="Georgia, serif" fontSize="22" fontStyle="italic">
            Silver Crest
          </text>
        </svg>
      );
    case "sokany":
      return (
        <svg viewBox="0 0 150 36" className={className} aria-hidden>
          <text x="0" y="26" fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="22" letterSpacing="4">
            SOKANY
          </text>
        </svg>
      );
    case "igloo":
      return (
        <svg viewBox="0 0 120 36" className={className} aria-hidden>
          <text x="0" y="28" fill="currentColor" fontFamily="Georgia, serif" fontSize="28">
            Igloo
          </text>
        </svg>
      );
    case "coleman":
      return (
        <svg viewBox="0 0 170 36" className={className} aria-hidden>
          <text x="0" y="27" fill="currentColor" fontFamily="system-ui, sans-serif" fontSize="22" fontWeight="600">
            COLEMAN
          </text>
        </svg>
      );
    case "boma":
      return (
        <svg viewBox="0 0 110 36" className={className} aria-hidden>
          <text
            x="0"
            y="28"
            fill="currentColor"
            fontFamily="system-ui, sans-serif"
            fontSize="26"
            fontWeight="700"
            letterSpacing="2"
          >
            BOMA
          </text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 36" className={className} aria-hidden>
          <text x="0" y="28" fill="currentColor" fontFamily="Georgia, serif" fontSize="26">
            {label}
          </text>
        </svg>
      );
  }
}

export function LogoMarquee() {
  const loop = [...marks, ...marks];
  return (
    <section className="overflow-hidden bg-accent py-6 text-white md:py-12" aria-label="Brands">
      <p className="text-center font-serif text-xl md:text-3xl">BRANDS</p>
      <div
        className="ak-logo-marquee-wrap mt-5 overflow-hidden md:mt-8"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <ul className="ak-logo-marquee">
          {loop.map((mark, index) => (
            <li
              key={`${mark.id}-${index}`}
              className="flex h-14 w-[12.5rem] shrink-0 items-center justify-center px-6 md:w-[14.5rem]"
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
