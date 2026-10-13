import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Create an account",
  description: "Create an optional Ashanti's Kitchenware account to keep your orders.",
  path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
