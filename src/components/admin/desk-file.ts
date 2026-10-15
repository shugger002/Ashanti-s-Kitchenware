import { prepareImportFormData } from "@/lib/browser-spreadsheet";

export function downloadDeskFile(url: string) {
  window.location.assign(url);
}

export async function postDeskForm<T extends { message: string }>(
  url: string,
  form: HTMLFormElement,
  fallback: T,
): Promise<T> {
  let body: FormData;
  try {
    body = await prepareImportFormData(form);
  } catch (error) {
    return {
      ...fallback,
      message: error instanceof Error ? error.message : "Could not read that file on this device.",
    };
  }
  const response = await fetch(url, {
    method: "POST",
    body,
    credentials: "same-origin",
  });
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (response.status === 413) {
      return {
        ...fallback,
        message:
          "That file is still too large after reading. Download a CSV from Google Sheets: File → Download → Comma-separated values.",
      };
    }
    return {
      ...fallback,
      message: `Could not import that file (${response.status}). Try a CSV from Google Sheets: File → Download → Comma-separated values.`,
    };
  }
}
