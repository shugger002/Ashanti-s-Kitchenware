import { policySourceNote } from "@/content/policies";

export function PolicyPage({
  title,
  updated,
  sections,
}: {
  title: string;
  updated: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-8 pb-24 lg:px-8 lg:py-16">
      <h1 className="text-3xl md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {updated}</p>
      <p className="mt-4 text-xs text-muted">{policySourceNote}</p>
      <div className="mt-10 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl">{section.heading}</h2>
            <p className="mt-2 max-w-prose leading-relaxed text-muted">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
