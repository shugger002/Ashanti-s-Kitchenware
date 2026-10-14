import { PolicyPage } from "@/components/store/policy-page";
import { refundPolicy } from "@/content/policies";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: refundPolicy.title,
  description: "Returns and refunds for Ashanti's Kitchenware orders.",
  path: "/refunds",
});

export default function RefundsPage() {
  return <PolicyPage {...refundPolicy} />;
}
