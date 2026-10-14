import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Wishlist",
  description: "Pieces you saved on this device at Ashanti's Kitchenware.",
  path: "/wishlist",
});

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
