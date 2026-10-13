export type JournalArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Guide" | "Care" | "Recipe notes";
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
    title: "How to build your first cookware set",
    excerpt: "Start with one good pot, one pan you will actually use, and a lid that fits. Add the rest as your meals ask for them.",
    category: "Guide",
    minutes: 6,
    date: "11 October 2026",
    image: "/demo/pot-set.jpg",
    imageAlt: "Stacked stainless pots (demo photograph)",
    relatedSlugs: ["demo-stainless-pot-set", "demo-cast-iron-dutch-oven"],
    body: [
      {
        heading: "Buy for the meals you already cook",
        paragraphs: [
          "A first set does not need twelve pieces. In Accra kitchens, most weeks turn on soup, rice, stew, and something fried. A mid-size pot with a lid, a frying pan, and a heavy pot for slow dishes will cover more nights than a boxed set you never unpack.",
          "If you share a cooker or cook on a compact hob, check the base size before you buy. A pan that overhangs the ring wastes heat and warps faster.",
        ],
      },
      {
        heading: "Materials that earn their keep",
        paragraphs: [
          "Stainless steel is easy to wash and does not mind metal spoons. Cast iron holds heat for stews and oven finishes, but it is heavy and needs drying after a wash. Nonstick is useful for eggs; treat it gently and replace it when the coating wears.",
          "Ignore marketing that promises one pan will do everything forever. Match the piece to the job, then look after it.",
        ],
      },
      {
        heading: "What to add later",
        paragraphs: [
          "A kettle, a rice cooker, and a blender earn their counter space if you use them weekly. Storage racks help only if you measure the gap between worktop and wall cupboard first.",
          "When you are ready, photograph what you already own and bring the list to the Accra shop or use it against the online catalogue. Buy the next piece, not the whole aisle.",
        ],
      },
    ],
  },
  {
    slug: "essential-tools-every-home-cook-needs",
    title: "The essential tools every home cook needs",
    excerpt: "A short list of tools that earn drawer space: a board, a sharp knife, a ladle, and heat you can control.",
    category: "Guide",
    minutes: 5,
    date: "11 October 2026",
    image: "/demo/kettle.jpg",
    imageAlt: "Stainless electric kettle (demo photograph)",
    relatedSlugs: ["demo-electric-kettle", "demo-home-blender"],
    body: [
      {
        heading: "The four that do most of the work",
        paragraphs: [
          "A stable cutting board, one sharp chef’s knife, a wooden or heat-safe spoon, and a pot that sits flat on your hob. Everything else is a specialist.",
          "If your knife is dull, cooking feels harder than it is. If your board slides, you cook less often. Fix those two before buying gadgets.",
        ],
      },
      {
        heading: "Heat and water",
        paragraphs: [
          "A kettle you trust is as useful as a spare pot. An air fryer or blender is worth it only if it replaces a method you already use — reheating leftovers, blending soups, or roasting small batches without lighting the oven.",
          "Check plug type and wattage against your home wiring. Demo listings on this site still need wattage confirmed against the unit on the shelf.",
        ],
      },
      {
        heading: "Keep the drawer honest",
        paragraphs: [
          "If a tool has not been used in a month, it is taking space from something you reach for. The same rule applies to the catalogue: if a piece does not match how you cook, leave it.",
        ],
      },
    ],
  },
  {
    slug: "how-to-care-for-wooden-kitchen-utensils",
    title: "How to care for wooden kitchen utensils",
    excerpt: "Wash, dry, and oil. Wood lasts when it is not left standing in the sink.",
    category: "Care",
    minutes: 4,
    date: "11 October 2026",
    image: "/demo/dutch-oven.jpg",
    imageAlt: "Cast iron Dutch oven (demo photograph)",
    relatedSlugs: ["demo-cast-iron-dutch-oven", "demo-kitchen-storage-rack"],
    body: [
      {
        heading: "Daily wash",
        paragraphs: [
          "Use warm water, a little soap, and a cloth. Do not soak wooden spoons or boards. Standing water raises the grain and can split the piece.",
          "Dry immediately and stand the utensil so air reaches both sides. A crowded drying rack that stays damp is worse than a quick towel dry.",
        ],
      },
      {
        heading: "Oil when the wood looks thirsty",
        paragraphs: [
          "When the surface looks pale or feels rough, rub on a thin coat of food-safe mineral oil or a dedicated board oil. Wipe the excess. Do this more often in dry harmattan months.",
          "Skip vegetable oil from the pantry for long-term care — it can go rancid on the surface.",
        ],
      },
      {
        heading: "When to retire a piece",
        paragraphs: [
          "Deep cracks that trap food, a sour smell that will not wash out, or a board that rocks on the counter are signs to replace it. Care extends life; it does not make a split board safe.",
        ],
      },
    ],
  },
];

export function getJournalArticle(slug: string) {
  return journalArticles.find((article) => article.slug === slug) ?? null;
}
