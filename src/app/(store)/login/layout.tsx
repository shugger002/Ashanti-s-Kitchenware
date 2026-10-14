import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Sign in",
  description: "Sign in to your Ashanti's Kitchenware account, or continue as a guest.",
  path: "/login",
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
