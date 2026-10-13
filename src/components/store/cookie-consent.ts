export const COOKIE_CONSENT_KEY = "ak_cookie_consent";

type Consent = "accepted" | "rejected";

type State = {
  consent: Consent | null;
  panelOpen: boolean;
};

let state: State = { consent: null, panelOpen: false };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function readStoredConsent(): Consent | null {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function hydrateCookieConsent() {
  state = { ...state, consent: readStoredConsent() };
  emit();
}

export function getCookieConsentState() {
  return state;
}

export function subscribeCookieConsent(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setCookieConsent(value: Consent) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  state = { consent: value, panelOpen: false };
  emit();
}

export function openCookieSettings() {
  state = { ...state, panelOpen: true };
  emit();
}

export function closeCookieSettings() {
  state = { ...state, panelOpen: false };
  emit();
}
