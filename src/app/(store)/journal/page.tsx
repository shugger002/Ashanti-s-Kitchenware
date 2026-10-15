import Link from "next/link";
import { journalArticles } from "@/content/journal";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Guides",
  description: "How to choose and look after kitchen appliances at Ashanti's Kitchenware.",
  path: "/journal",
});

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
      <p className="text-sm text-muted">
        <Link href="/">Home</Link> / Guides
      </p>
      <h1 className="mt-4 text-4xl">Guides</h1>
      <p className="mt-3 max-w-2xl text-muted">
        How to choose a kitchen appliance, what to check on the listing, and how to look after the unit.
      </p>
      <ul className="mt-12 grid gap-10 md:grid-cols-3">
        {journalArticles.map((article) => (
          <li key={article.slug}>
            <Link href={`/journal/${article.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.image} alt={article.imageAlt} className="h-52 w-full rounded-3xl object-cover" />
              <p className="mt-3 text-xs uppercase tracking-wide text-muted">
                {article.category} · {article.minutes} min read · {article.date}
              </p>
              <h2 className="mt-2 font-serif text-2xl">{article.title}</h2>
              <p className="mt-2 text-sm text-muted">{article.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
