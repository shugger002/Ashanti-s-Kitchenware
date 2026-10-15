/**
 * Visual system: client red and white. Official wordmark lettering reads Ashanti's Kitchenwear.
 * Legal name of the shop is Ashanti's Kitchenware.
 * Phone and email below were transcribed from ashantiskitchenware.com.
 * Street address is left blank until the shop confirms it — Accra Mall is not the location.
 */
export const brand = {
  name: "Ashanti's Kitchenware",
  domain: "ashantisakitchenware.com",
  logoSrc: "/logo.png?v=official",
  placeholderNotice:
    "Demo product photography is still in use. Replace with photographed stock before launch.",
} as const;

export const defaultContact = {
  legalName: "Ashanti's Kitchenware",
  tradingName: "Ashanti's Kitchenware",
  email: "support@ashantiskitchenware.com",
  phoneDisplay: "+233 (0) 20 194 4235",
  phoneE164: "+233201944235",
  whatsappE164: "+233201944235",
  addressLine1: "",
  city: "Accra",
  region: "Greater Accra",
  country: "Ghana",
} as const;
