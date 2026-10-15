/** Exact-model retailer photos only. OEM packing-list PICs with no public listing stay unlisted. */
export const ASANTE_CONTAINER_PHOTOS: Record<
  string,
  { files: string[]; source: string }
> = {
  "BF-5092": {
    source: "Bardefu BF-5092 retailer listing (Shopify CDN)",
    files: [
      "/products/BF-5092/01.jpg",
      "/products/BF-5092/02.jpg",
      "/products/BF-5092/03.jpg",
      "/products/BF-5092/04.jpg",
      "/products/BF-5092/05.jpg",
    ],
  },
  "HM-2067": {
    source: "Hoffmans HM-2067 retailer listings",
    files: ["/products/HM-2067/01.jpg", "/products/HM-2067/02.png"],
  },
  "HM-638": {
    source: "Hoffmans HM-638 retailer listing",
    files: ["/products/HM-638/01.jpg"],
  },
  "HM-765": {
    source: "Hoffmans HM-765 retailer listing",
    files: ["/products/HM-765/01.webp"],
  },
};
