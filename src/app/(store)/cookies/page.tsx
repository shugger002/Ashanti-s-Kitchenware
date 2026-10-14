import { PolicyPage } from "@/components/store/policy-page";
import { cookiePolicy } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: cookiePolicy.title,
  description: "How Ashanti's Kitchenware uses cookies.",
  path: "/cookies",
});

export default function CookiesPage() {
  return <PolicyPage {...cookiePolicy} />;
}
