/**
 * Keyboard movement shared by the dropdown and the suggestion list: returns the
 * option to highlight after an arrow / Home / End key, or null for other keys.
 */
export function moveHighlight(key: string, current: number, count: number): number | null {
  switch (key) {
    case 'ArrowDown':
      return Math.min(current + 1, count - 1);
    case 'ArrowUp':
      return Math.max(current - 1, 0);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
