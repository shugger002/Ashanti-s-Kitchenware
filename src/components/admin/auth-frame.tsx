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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-5 py-16">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.logoSrc}
        alt={brand.name}
        className="mb-8 h-9 w-auto max-w-[10rem] object-contain brightness-0"
      />
      <div className="admin-panel w-full max-w-md p-6 sm:p-8">
        <h1 className="text-center text-[2rem] leading-tight">{title}</h1>
        <p className="mt-2 text-center text-sm text-muted">{description}</p>
        {children}
      </div>
    </div>
  );
}
