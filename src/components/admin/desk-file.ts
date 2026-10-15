export function downloadDeskFile(url: string) {
  window.location.assign(url);
}

export async function postDeskForm<T extends { message: string }>(
  url: string,
  form: HTMLFormElement,
  fallback: T,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: new FormData(form),
    credentials: "same-origin",
  });
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return {
      ...fallback,
      message: `Could not import that file (${response.status}). Try a CSV from Google Sheets: File → Download → Comma-separated values.`,
    };
  }
}
