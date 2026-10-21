/**
 * Visual system: client red and white. Wordmark and legal name: Ashanti's Kitchenware.
 * Phone and email below were transcribed from ashantiskitchenware.com.
 * Google listing supplied by the shop: https://maps.app.goo.gl/MQ5u4nCsSU6oH1q2A
 */
export const brand = {
  name: "Ashanti's Kitchenware",
  domain: "ashantisakitchenware.com",
  logoSrc: "/logo.png?v=kitchenware",
  placeholderNotice:
    "Demo product photography is still in use. Replace with photographed stock before launch.",
} as const;

export const shopMap = {
  lat: 5.5713673,
  lng: -0.2722907,
  url: "https://maps.app.goo.gl/MQ5u4nCsSU6oH1q2A",
  directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=5.5713673,-0.2722907",
} as const;

/** Accra shop hours given by the shop. */
export const shopHours = "Monday to Saturday, 7 a.m. to 7 p.m. Closed Sunday." as const;

export const defaultContact = {
  legalName: "Ashanti's Kitchenware",
  tradingName: "Ashanti's Kitchenware",
  email: "ashantiskitchenware@gmail.com",
  phoneDisplay: "+233 (0) 20 194 4235",
  phoneE164: "+233201944235",
  whatsappE164: "+233201944235",
  addressLine1: "108 Dansoman-Sakaman, Alui Mahama Street, Blue Lagoon Loop",
  city: "Accra",
  region: "Greater Accra",
  country: "Ghana",
  mapsUrl: shopMap.url,
} as const;
