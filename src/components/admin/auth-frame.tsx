import { brand } from "@/config/brand";

export function AdminAuthFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(18rem,22rem)_1fr]">
      <div className="hidden flex-col justify-between bg-foreground px-10 py-12 text-background lg:flex">
        <div className="w-fit rounded-sm bg-background px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.logoSrc} alt={brand.name} className="h-10 w-auto max-w-[11rem] object-contain brightness-0" />
        </div>
        <div>
          <p className="inline-block rounded bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white">
            Staff only
          </p>
          <p className="mt-4 font-serif text-4xl leading-tight">The desk for the Accra shop.</p>
          <p className="mt-4 max-w-sm text-sm text-background/70">
            Pack against the same four steps customers see. Delivery stays on WhatsApp. The storefront is the other
            door.
          </p>
        </div>
        <p className="text-xs text-background/50">{brand.domain}</p>
      </div>
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-5 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brand.logoSrc}
          alt={brand.name}
          className="mb-6 h-9 w-auto max-w-[10rem] object-contain brightness-0 lg:hidden"
        />
        <h1 className="text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        {children}
      </div>
    </div>
  );
}
