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
