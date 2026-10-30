import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "My cart",
  description: "Review items in your Ashanti's Kitchenware cart.",
  path: "/cart",
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
