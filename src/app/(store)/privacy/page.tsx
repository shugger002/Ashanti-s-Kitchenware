import { PolicyPage } from "@/components/store/policy-page";
import { privacyPolicy } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: privacyPolicy.title,
  description: "How Ashanti's Kitchenware collects and uses personal data.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <PolicyPage {...privacyPolicy} />;
}
