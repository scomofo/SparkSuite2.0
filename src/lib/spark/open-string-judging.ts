/** Confirm the intended open string by its own pitch, not by the closest
 * open-string index. Important for re-entrant instruments such as ukulele.
 */
export function matchesOpenStringTarget(
  detectedHz: number,
  expectedHz: number | undefined,
  toleranceCents = 80,
): boolean {
  if (!Number.isFinite(detectedHz) || detectedHz <= 0 ||
      expectedHz === undefined || !Number.isFinite(expectedHz) || expectedHz <= 0) return false;
  return Math.abs(1200 * Math.log2(detectedHz / expectedHz)) <= toleranceCents;
}
