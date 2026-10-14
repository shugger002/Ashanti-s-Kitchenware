import { PolicyPage } from "@/components/store/policy-page";
import { termsPolicy } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: termsPolicy.title,
  description: "Terms for using the Ashanti's Kitchenware store.",
  path: "/terms",
});

export default function TermsPage() {
  return <PolicyPage {...termsPolicy} />;
}
