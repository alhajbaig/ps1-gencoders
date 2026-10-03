/**
 * Realistic Request ID Generator for RaktSetu Blood Network
 * Format: REQ-2026-00421
 */
export function generateRequestId(): string {
  const year = new Date().getFullYear();
  // Generate realistic 5-digit sequence number (between 00400 and 00999 or random 5-digit)
  const randomSuffix = Math.floor(420 + Math.random() * 580);
  const formattedSuffix = String(randomSuffix).padStart(5, '0');
  return `REQ-${year}-${formattedSuffix}`;
}

export function isValidRequestId(id: string): boolean {
  return /^REQ-\d{4}-\d{5}$/.test(id);
}
