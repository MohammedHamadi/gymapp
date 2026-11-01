export function moneyCents(value, label = "Amount") {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") {
    throw new Error(`${label} must be a non-negative amount.`);
  }
  const number = Number(value);
  const cents = Math.round(number * 100);
  if (!Number.isFinite(number) || number < 0 || !Number.isSafeInteger(cents)
    || Math.abs(number * 100 - cents) > 0.000001) {
    throw new Error(`${label} must be non-negative with at most two decimal places.`);
  }
  return cents;
}
