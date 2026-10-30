export function normalizeBarcode(input) {
  return String(input || "").replace(/\s+/g, "").toUpperCase();
}

export function barcodeCandidates(input) {
  const clean = normalizeBarcode(input);
  const qwerty = { "!": "1", "@": "2", "#": "3", "$": "4", "%": "5", "^": "6", "&": "7", "*": "8", "(": "9", ")": "0", ":": "M", ";": "M" };
  const azerty = { "&": "1", "É": "2", '"': "3", "'": "4", "(": "5", "-": "6", "È": "7", "_": "8", "Ç": "9", "À": "0", "?": "M", ",": "M" };
  const map = (mapping) => [...clean].map((c) => mapping[c] || c).join("");
  // The mangled M identifies the keyboard direction, including overlapping & and (.
  if (/^GY[:;]/.test(clean)) return [map(qwerty)];
  if (/^GY[?,]/.test(clean)) return [map(azerty)];
  if (/^GYM\d+$/.test(clean)) return [clean];
  return [...new Set([clean, map(qwerty), map(azerty)])];
}
