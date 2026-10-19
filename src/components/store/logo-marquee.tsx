const marks = [
  { id: "hoffmans", label: "Hoffmans", src: "/brands/hoffmans.png" },
  { id: "silver-crest", label: "Silver Crest", src: "/brands/silver-crest.png" },
  { id: "sokany", label: "Sokany", src: "/brands/sokany.png" },
  { id: "igloo", label: "Igloo", src: "/brands/igloo.png" },
  { id: "coleman", label: "Coleman", src: "/brands/coleman.png" },
  { id: "boma", label: "BOMA", src: "/brands/boma.png" },
  { id: "ninja", label: "Ninja", src: "/brands/ninja.png" },
] as const;

export function LogoMarquee() {
  const loop = [...marks, ...marks];
  return (
    <section className="overflow-hidden bg-accent py-3 text-white md:py-4" aria-label="Brands">
      <p className="text-center font-serif text-sm tracking-[0.2em] md:text-base">BRANDS</p>
      <div
        className="ak-logo-marquee-wrap mt-2 overflow-hidden touch-pan-y md:mt-3"
        style={{
          maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <ul className="ak-logo-marquee pointer-events-none">
          {loop.map((mark, index) => (
            <li
              key={`${mark.id}-${index}`}
              className="flex h-10 shrink-0 items-center justify-center px-3 md:h-12 md:px-5"
              aria-hidden={index >= marks.length}
            >
              {index < marks.length ? <span className="sr-only">{mark.label}</span> : null}
              <span className="flex h-8 items-center rounded-sm bg-white px-2.5 md:h-9 md:px-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mark.src}
                  alt=""
                  className="h-5 w-auto max-w-[8.5rem] object-contain object-center md:h-6 md:max-w-[10.5rem]"
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
