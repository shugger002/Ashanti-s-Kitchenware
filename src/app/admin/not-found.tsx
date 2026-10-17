export default function AdminNotFound() {
  return (
    <div className="admin-panel p-6">
      <h1 className="text-xl font-medium">That desk page is not here</h1>
      <p className="mt-2 text-sm text-neutral-800">Go back to Home, or open Products.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href="/admin" className="rounded-md bg-accent px-4 py-2 text-sm text-white">
          Home
        </a>
        <a href="/admin/products" className="rounded-md border border-border bg-white px-4 py-2 text-sm">
          Products
        </a>
      </div>
    </div>
  );
}
