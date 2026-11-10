/** Local Ghana MSISDN, 0-prefixed (Moolre). */
export function ghanaLocalMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length >= 12) return `0${digits.slice(3)}`;
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(0, 10);
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

/** Ghana number without plus, 233… (Hubtel). */
export function ghanaInternationalMsisdn(phone: string): string {
  const local = ghanaLocalMsisdn(phone);
  if (local.startsWith("0")) return `233${local.slice(1)}`;
  if (local.startsWith("233")) return local;
  return local;
}

const MTN = new Set(["024", "025", "053", "054", "055", "059"]);
const TELECEL = new Set(["020", "050"]);
const AT = new Set(["026", "027", "056", "057"]);

/** Moolre channel from a Ghana number: 13=MTN, 6=Telecel, 7=AT. */
export function inferMomoChannel(phone: string): "13" | "6" | "7" | null {
  const local = ghanaLocalMsisdn(phone);
  if (local.length < 3) return null;
  const prefix = local.slice(0, 3);
  if (MTN.has(prefix)) return "13";
  if (TELECEL.has(prefix)) return "6";
  if (AT.has(prefix)) return "7";
  return null;
}
