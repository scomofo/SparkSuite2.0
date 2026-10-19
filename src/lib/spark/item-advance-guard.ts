/** Deduplicate actions from a stale rendered exercise after a rapid click or key press.
 * Different item IDs may advance independently when the next item is rendered.
 */
export function createItemAdvanceGuard() {
  const handled = new Set<string>();
  return {
    claim(itemId: string): boolean {
      if (!itemId || handled.has(itemId)) return false;
      handled.add(itemId);
      return true;
    },
  };
}
