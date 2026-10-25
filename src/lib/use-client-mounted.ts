import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** False on the server and during this component's hydration; true after it has mounted. */
export function useClientMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
