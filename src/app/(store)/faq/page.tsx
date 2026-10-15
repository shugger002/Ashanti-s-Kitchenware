import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "FAQ",
  description: "Ordering, delivery, returns, and payment questions for Ashanti's Kitchenware.",
  path: "/faq",
});

const faqs = [
  {
    q: "Where are you based?",
    a: "The shop is at Hyde Street, Sakaman, Odorkor, Accra. Open the pin in Google Maps, or call +233 (0) 20 194 4235 / WhatsApp / support@ashantiskitchenware.com. Collection and delivery are arranged with the shop.",
  },
  {
    q: "What currency are prices in?",
    a: "Ghana Cedis (GHS), as shown on each listing. Ask the shop if you need a tax invoice.",
  },
  {
    q: "Do you offer free shipping over a set amount?",
    a: "No published free-shipping threshold. If you choose delivery, the shop confirms the charge and timing on WhatsApp after you order.",
  },
  {
    q: "How do I pay?",
    a: "When online payment is configured, you pay with Hubtel (card, mobile money, GHQR) or Moolre (a prompt on your phone). We do not store card numbers or MoMo PINs. The order is paid only after the provider confirms it. If payment is not configured, order through the shop by phone or WhatsApp.",
  },
  {
    q: "Can I check out as a guest?",
    a: "Yes. You can create an account afterwards to keep order history.",
  },
  {
    q: "How do returns work?",
    a: "Request a return within 7 days of delivery for faulty, damaged, or incorrect items. See the refund policy for conditions.",
  },
  {
    q: "Are the photographs on the site the real stock?",
    a: "Published products should be photographed from stock. Demo images are labelled and must be replaced before launch.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <h1 className="text-4xl">Questions</h1>
      <ul className="mt-10 space-y-4">
        {faqs.map((item) => (
          <li
            key={item.q}
            id={item.q === "How do I pay?" ? "payments" : undefined}
            className="rounded-3xl border border-border bg-surface p-5"
          >
            <h2 className="font-serif text-xl">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm">
        Still stuck? <Link href="/contact" className="text-accent">Contact the shop</Link> or read the{" "}
        <Link href="/refunds" className="text-accent">
          refund policy
        </Link>
        .
      </p>
    </div>
  );
}
