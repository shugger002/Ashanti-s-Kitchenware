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
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-16">
      <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.28em] text-muted">{brand.name}</p>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h1 className="text-center text-2xl font-medium">{title}</h1>
        <p className="mt-2 text-center text-sm text-muted">{description}</p>
        {children}
      </div>
    </div>
  );
}
