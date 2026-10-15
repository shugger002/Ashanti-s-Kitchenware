export type JournalArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Guide" | "Care";
  minutes: number;
  date: string;
  image: string;
  imageAlt: string;
  body: { heading: string; paragraphs: string[] }[];
  relatedSlugs: string[];
};

export const journalArticles: JournalArticle[] = [
  {
    slug: "how-to-build-your-first-cookware-set",
    title: "How to choose a kitchen appliance",
    excerpt: "Match wattage, plug, and size to the unit on the shelf before you pay.",
    category: "Guide",
    minutes: 6,
    date: "11 October 2026",
    image: "/demo/blender.jpg",
    imageAlt: "Home blender (demo photograph)",
    relatedSlugs: ["demo-home-blender", "demo-air-fryer"],
    body: [
      {
        heading: "Start with the job, then the model",
        paragraphs: [
          "This shop sells kitchen appliances and related household pieces. Pick the appliance you need — blender, kettle, rice cooker, fryer — then check the listing against the unit on the shelf.",
          "Piece count, litre mark, and colour should match the product page. Demo listings on this site are layout samples and are not offers for sale.",
        ],
      },
      {
        heading: "Power and plug",
        paragraphs: [
          "Confirm wattage and plug type for Ghanaian sockets before you order. If the listing does not name wattage, ask the Accra Mall shop rather than guessing.",
          "A higher wattage figure is not automatically better. It has to match the wiring in the room where you will use the appliance.",
        ],
      },
      {
        heading: "What to add later",
        paragraphs: [
          "Buy the next appliance you will use, not a boxed bundle you cannot place. Measure the gap on the worktop first.",
          "When you are ready, bring the model number to the Accra shop or match it against the online catalogue.",
        ],
      },
    ],
  },
  {
    slug: "essential-tools-every-home-cook-needs",
    title: "What to check before you buy",
    excerpt: "Size, wattage, piece count, and whether the photograph is of the stocked model.",
    category: "Guide",
    minutes: 5,
    date: "11 October 2026",
    image: "/demo/kettle.jpg",
    imageAlt: "Stainless electric kettle (demo photograph)",
    relatedSlugs: ["demo-electric-kettle", "demo-home-blender"],
    body: [
      {
        heading: "Read the specification",
        paragraphs: [
          "Capacity, voltage, and accessories should be on the product page. If a field is missing, treat it as unconfirmed until staff check the carton.",
          "Colour options are only listed when the shop stocks them. “As shown” means the photograph, not a range of unlisted colours.",
        ],
      },
      {
        heading: "Kettles, blenders, and fryers",
        paragraphs: [
          "A kettle, blender, or air fryer is worth the counter space if you will use that appliance. Check the base size and the cord length against your socket.",
          "Demo listings still need wattage confirmed against the unit on the shelf.",
        ],
      },
      {
        heading: "Skip what you will not use",
        paragraphs: [
          "If a piece does not match the model you need, leave it. The catalogue is stock, not a full kitchen makeover.",
        ],
      },
    ],
  },
  {
    slug: "how-to-care-for-wooden-kitchen-utensils",
    title: "Looking after kitchen appliances",
    excerpt: "Unplug, wash removable parts as the listing says, and dry before you store the unit.",
    category: "Care",
    minutes: 4,
    date: "11 October 2026",
    image: "/demo/rice-cooker.jpg",
    imageAlt: "Rice cooker (demo photograph)",
    relatedSlugs: ["demo-rice-cooker", "demo-air-fryer"],
    body: [
      {
        heading: "Daily use",
        paragraphs: [
          "Unplug before you wash. Removable jugs, bowls, and lids usually take warm water and a little soap. Do not immerse a motor housing unless the listing says it is safe.",
          "Dry parts before you reassemble. Standing water in a jug or cooker bowl is a common way to shorten the life of a unit.",
        ],
      },
      {
        heading: "When something fails",
        paragraphs: [
          "If an item arrives faulty, damaged, or incorrect, you have seven days to ask for a return. Keep the carton and the proof of purchase.",
          "We do not invent star ratings. Specs that are missing from a listing should be confirmed with the shop.",
        ],
      },
      {
        heading: "Storage",
        paragraphs: [
          "Leave space around vents. Do not coil a hot cord tightly against the housing. If a rack or cabinet is listed with the appliance, measure the gap first.",
        ],
      },
    ],
  },
];

export function getJournalArticle(slug: string) {
  return journalArticles.find((article) => article.slug === slug) ?? null;
}
