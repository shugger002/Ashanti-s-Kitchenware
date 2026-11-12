"use client";

import { useState } from "react";
import { AdminSection } from "@/components/admin/ui";
import { adminButton } from "@/components/admin/ui";

export function HomepageEditor({
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  announcementEnabled,
  announcementText,
}: {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  announcementEnabled: boolean;
  announcementText: string;
}) {
  const [hero, setHero] = useState({ title, subtitle, ctaLabel, ctaHref, announcementEnabled, announcementText });

  return (
    <>
      <AdminSection className="max-w-xl" title="Homepage words">
        <p className="text-sm leading-relaxed text-muted">
          These sit under the utensils photo. The announcement is the thin strip at the very top of the shop. Preview
          updates as you type. Publish writes to the live shop.
        </p>
        <label className="mt-4 block text-sm">
          Intro title
          <input
            name="title"
            value={hero.title}
            onChange={(event) => setHero({ ...hero, title: event.target.value })}
            className="input mt-1"
          />
        </label>
        <label className="mt-4 block text-sm">
          Intro text
          <textarea
            name="subtitle"
            value={hero.subtitle}
            onChange={(event) => setHero({ ...hero, subtitle: event.target.value })}
            rows={3}
            className="input mt-1"
          />
        </label>
        <label className="mt-4 block text-sm">
          Button label
          <input
            name="ctaLabel"
            value={hero.ctaLabel}
            onChange={(event) => setHero({ ...hero, ctaLabel: event.target.value })}
            className="input mt-1"
          />
        </label>
        <label className="mt-4 block text-sm">
          Button link
          <input
            name="ctaHref"
            value={hero.ctaHref}
            onChange={(event) => setHero({ ...hero, ctaHref: event.target.value })}
            className="input mt-1"
          />
        </label>
        <label className="mt-4 flex gap-2 text-sm">
          <input
            type="checkbox"
            name="announcementEnabled"
            checked={hero.announcementEnabled}
            onChange={(event) => setHero({ ...hero, announcementEnabled: event.target.checked })}
          />
          Show announcement bar
        </label>
        <label className="mt-4 block text-sm">
          Announcement text
          <input
            name="announcementText"
            value={hero.announcementText}
            onChange={(event) => setHero({ ...hero, announcementText: event.target.value })}
            className="input mt-1"
          />
        </label>
        <button className={`${adminButton()} mt-5`} type="submit">
          Publish homepage
        </button>
      </AdminSection>
      <AdminSection className="max-w-xl" title="Preview" hint="This is how the words will read. Photos stay as they are on the live shop.">
        <div className="overflow-hidden rounded-sm border border-border bg-[#f6f1ea]">
          {hero.announcementEnabled && hero.announcementText ? (
            <p className="bg-accent px-3 py-2 text-center text-[10px] uppercase tracking-[0.12em] text-white">
              {hero.announcementText}
            </p>
          ) : (
            <p className="px-3 py-2 text-center text-xs text-muted">Announcement off</p>
          )}
          <div className="px-4 py-8 text-center">
            <p className="font-serif text-2xl">{hero.title || "Title"}</p>
            {hero.subtitle ? <p className="mx-auto mt-3 max-w-md text-sm text-muted">{hero.subtitle}</p> : null}
            {hero.ctaLabel ? (
              <span className="mt-5 inline-flex min-h-11 items-center rounded-sm bg-accent px-4 text-sm text-white">
                {hero.ctaLabel}
                <span className="sr-only"> to {hero.ctaHref || "/"}</span>
              </span>
            ) : null}
          </div>
        </div>
      </AdminSection>
    </>
  );
}
