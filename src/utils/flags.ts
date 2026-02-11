const REGIONAL_INDICATOR_OFFSET = 127397;

export function getFlagEmoji(countryCode: string): string {
  const normalized = countryCode.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);

  if (normalized.length !== 2) {
    return '??';
  }

  return String.fromCodePoint(
    normalized.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET,
    normalized.charCodeAt(1) + REGIONAL_INDICATOR_OFFSET
  );
}
