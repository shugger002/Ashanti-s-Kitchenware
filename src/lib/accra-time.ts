export function formatAccraWhen(value: string | Date) {
  return new Date(value).toLocaleString("en-GH", {
    timeZone: "Africa/Accra",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
