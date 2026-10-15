import Link from "next/link";
import { notFound } from "next/navigation";
import { NewsletterForm } from "@/components/store/newsletter-form";
import { ProductRail } from "@/components/store/product-rail";
import { getJournalArticle, journalArticles } from "@/content/journal";
import { jsonLdText, pageMeta } from "@/lib/seo";
import { getAppUrl } from "@/server/env";
import { getProductBySlug } from "@/server/catalog/queries";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getJournalArticle(slug);
  if (!article) return pageMeta({ title: "Guides", description: "Article not found", path: `/journal/${slug}` });
  return pageMeta({ title: article.title, description: article.excerpt, path: `/journal/${article.slug}` });
}

export default async function JournalArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getJournalArticle(slug);
  if (!article) notFound();
  const related = journalArticles.filter((item) => item.slug !== article.slug);
  const products = (
    await Promise.all(article.relatedSlugs.map((productSlug) => getProductBySlug(productSlug)))
  ).filter((item) => item !== null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    datePublished: "2026-10-11",
    author: { "@type": "Organization", name: "Ashanti's Kitchenware" },
    url: `${getAppUrl()}/journal/${article.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(jsonLd) }} />
      <nav className="text-sm text-muted">
        <Link href="/journal">Guides</Link> / {article.title}
      </nav>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={article.image} alt={article.imageAlt} className="mt-6 h-80 w-full rounded-3xl object-cover" />
      <p className="mt-6 text-xs uppercase tracking-wide text-muted">
        {article.category} · {article.minutes} min · {article.date} · Ashanti's Kitchenware
      </p>
      <h1 className="mt-3 text-4xl">{article.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">{article.excerpt}</p>
      {article.body.map((section) => (
        <section key={section.heading} className="mt-10">
          <h2 className="text-2xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mt-4 leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      <div className="mt-8 flex gap-3 text-sm">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${article.title} ${getAppUrl()}/journal/${article.slug}`)}`}
        >
          Share on WhatsApp
        </a>
        <a href={`mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(`${getAppUrl()}/journal/${article.slug}`)}`}>
          Email
        </a>
      </div>
      {products.length > 0 ? (
        <section className="mt-16">
          <h2 className="text-2xl">Recommended from the shop</h2>
          <ProductRail products={products} className="mt-8" />
        </section>
      ) : null}
      <section className="mt-16 rounded-3xl bg-surface p-8">
        <h2 className="text-2xl">Stock updates</h2>
        <p className="mt-2 text-sm text-muted">Restocks and listed appliances. No invented first-order discount.</p>
        <NewsletterForm />
      </section>
      <section className="mt-16">
        <h2 className="text-2xl">Related</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {related.map((item) => (
            <li key={item.slug}>
              <Link href={`/journal/${item.slug}`} className="text-accent">
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
