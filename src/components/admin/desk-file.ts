export function downloadDeskFile(url: string) {
  window.location.assign(url);
}

export async function postDeskForm<T>(url: string, form: HTMLFormElement, fallback: T): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: new FormData(form),
    credentials: "same-origin",
  });
  const data = (await response.json().catch(() => null)) as T | null;
  if (!data) return fallback;
  return data;
}
