import { requirePermission } from "@/server/auth/authorize";
import { listCategories } from "@/server/catalog/queries";
import { csvCell } from "@/lib/csv";

export async function GET() {
  await requirePermission("products.write");
  const categories = await listCategories(false);
  const exampleCategory = categories[0]?.name ?? "Cookware";
  const lines = [
    "name,sku,price,sale_price,stock,category,description,listed,featured,new,image_url",
    `${csvCell("Stainless kettle")},AK-KETTLE-01,1599,,8,${csvCell(exampleCategory)},${csvCell("Photograph this piece before listing.")},no,no,no,`,
  ];
  return new Response(`${lines.join("\n")}\n`, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="products-import.csv"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
