/** Wide photographs already used on the homepage, shown in place of the small catalogue file. */
const SHARP_CATALOG_PHOTOS: Record<string, { url: string; alt: string }> = {
  "2L-blender": {
    url: "/slides/blender.jpg",
    alt: "Hoffmans blender on a marble counter",
  },
  "electric-kettle-2-0l-st-8856": {
    url: "/slides/kettle.jpg",
    alt: "Blue and orange electric kettles",
  },
  "rice-cooker-mixed-colour": {
    url: "/slides/rice-cooker.jpg",
    alt: "Four coloured rice cookers",
  },
  "12-piece-cookware-set": {
    url: "/slides/cookware.jpg",
    alt: "Hammered cookware set",
  },
};

export function sharpCatalogPhoto(slug: string) {
  return SHARP_CATALOG_PHOTOS[slug] ?? null;
}
