import { pageMeta } from "@/lib/seo";

export const maxDuration = 30;

export const metadata = pageMeta({
  title: "Create an account",
  description: "Create an Ashanti's Kitchenware account to save orders. Guest checkout remains available.",
  path: "/register",
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
