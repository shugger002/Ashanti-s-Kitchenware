/**
 * Visual system: client red and white. Official wordmark lettering reads Ashanti's Kitchenwear.
 * Legal name of the shop is Ashanti's Kitchenware.
 * Phone and email below were transcribed from ashantiskitchenware.com.
 * Map pin supplied by the shop. Road name is OpenStreetMap’s reverse of that pin.
 */
export const brand = {
  name: "Ashanti's Kitchenware",
  domain: "ashantisakitchenware.com",
  logoSrc: "/logo.png?v=official",
  placeholderNotice:
    "Demo product photography is still in use. Replace with photographed stock before launch.",
} as const;

export const shopMap = {
  lat: 5.571348,
  lng: -0.272244,
  url: "https://maps.google.com/?q=5.571348,-0.272244",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=5.571348,-0.272244",
} as const;

export const defaultContact = {
  legalName: "Ashanti's Kitchenware",
  tradingName: "Ashanti's Kitchenware",
  email: "support@ashantiskitchenware.com",
  phoneDisplay: "+233 (0) 20 194 4235",
  phoneE164: "+233201944235",
  whatsappE164: "+233201944235",
  addressLine1: "Hyde Street, Sakaman, Odorkor",
  city: "Accra",
  region: "Greater Accra",
  country: "Ghana",
  mapsUrl: shopMap.url,
} as const;
