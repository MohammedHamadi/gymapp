export function normalizeBarcode(input: string): string {
  // Remove whitespace
  let clean = input.replace(/\s+/g, '');

  // Detect if the string contains characters typical of an AZERTY scanner on a QWERTY OS
  // (Shifted numbers !@#$%^&*() or the mapped M which is :)
  const hasQwertyMangledNumbers = /[!@#$%^&*()]/.test(clean);
  const isGymPrefixMangledQwerty = clean.startsWith('GY:') || clean.startsWith('gy;');

  // Detect if the string contains characters typical of a QWERTY scanner on an AZERTY OS
  // (Unshifted numbers &é"'(-è_çà or the mapped M which is ? or ,)
  const hasAzertyMangledNumbers = /[&é"'(\-è_çà]/.test(clean);
  const isGymPrefixMangledAzerty = clean.startsWith('GY?') || clean.startsWith('gy,');

  if (hasQwertyMangledNumbers || isGymPrefixMangledQwerty) {
    // Apply AZERTY-Scanner -> QWERTY-OS reverse mapping
    const qwertyToAzertyMap: Record<string, string> = {
      '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
      '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
      ':': 'M', ';': 'm',
      'Q': 'A', 'q': 'a',
      'A': 'Q', 'a': 'q',
      'W': 'Z', 'w': 'z',
      'Z': 'W', 'z': 'w'
    };
    return clean.split('').map(c => qwertyToAzertyMap[c] || c).join('');
  }

  if (hasAzertyMangledNumbers || isGymPrefixMangledAzerty) {
    // Apply QWERTY-Scanner -> AZERTY-OS reverse mapping
    const azertyToQwertyMap: Record<string, string> = {
      '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5',
      '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0',
      '?': 'M', ',': 'm',
      'A': 'Q', 'a': 'q',
      'Q': 'A', 'q': 'a',
      'Z': 'W', 'z': 'w',
      'W': 'Z', 'w': 'z'
    };
    return clean.split('').map(c => azertyToQwertyMap[c] || c).join('');
  }

  // If no obvious mangling is detected, return the cleaned input as-is.
  // This ensures normal manual typing on any layout works perfectly.
  return clean;
}
