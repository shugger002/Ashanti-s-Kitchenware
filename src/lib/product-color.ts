export type ProductColor = {
  variantId: string;
  name: string;
  hex: string;
};

const NAMED: Record<string, string> = {
  black: "#1a1a1a",
  charcoal: "#3d3d3d",
  navy: "#1b365d",
  blue: "#4a6fa5",
  steel: "#8aa0b4",
  stainless: "#c5c8cc",
  silver: "#c5c8cc",
  fog: "#d8d6d2",
  white: "#f4f4f4",
  ivory: "#f6f1ea",
  cream: "#f3ead9",
  sage: "#b7c9c2",
  mint: "#cfe3dc",
  terracotta: "#c45c3e",
  rust: "#b44a32",
  red: "#c8102e",
  gold: "#c9a227",
};

export const MAX_VISIBLE_SWATCHES = 6;

export function normalizeHex(value: string | undefined, fallbackName?: string): string {
  const raw = value?.trim() ?? "";
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
    return raw.length === 4
      ? `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase()
      : raw.toLowerCase();
  }
  if (fallbackName) {
    const named = NAMED[fallbackName.trim().toLowerCase()];
    if (named) return named;
  }
  return "#888888";
}

export function fallbackCardColor(productName: string): ProductColor {
  const lower = productName.toLowerCase();
  const match = Object.keys(NAMED).find((key) => lower.includes(key));
  if (match) {
    return {
      variantId: "",
      name: match.charAt(0).toUpperCase() + match.slice(1),
      hex: NAMED[match] ?? "#c5c8cc",
    };
  }
  return { variantId: "", name: "As shown", hex: "#c5c8cc" };
}

export function colorsForCard(colors: ProductColor[], productName: string): ProductColor[] {
  return colors.length > 0 ? colors : [fallbackCardColor(productName)];
}

export function colorsFromVariants(
  variants: { id: string; name: string; attributes: Record<string, string>; isActive?: boolean }[],
): ProductColor[] {
  return variants
    .filter((variant) => variant.isActive !== false)
    .map((variant) => {
      const name = variant.attributes.color || variant.name;
      return {
        variantId: variant.id,
        name,
        hex: normalizeHex(variant.attributes.hex, name),
      };
    });
}
