"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-white/95 p-6 shadow-sm">
      <h1 className="text-xl font-medium">This page did not open</h1>
      <p className="mt-2 text-sm text-neutral-800">Try again, or go back to Home.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className="rounded-md bg-accent px-4 py-2 text-sm text-white" onClick={() => reset()}>
          Reload
        </button>
        <a href="/admin" className="rounded-md border border-border bg-white px-4 py-2 text-sm">
          Home
        </a>
      </div>
    </div>
  );
}
