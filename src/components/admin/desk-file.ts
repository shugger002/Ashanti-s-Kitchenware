export async function downloadDeskFile(url: string, filename: string) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error("Could not download the template. Stay signed in and try again.");
  }
  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
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
