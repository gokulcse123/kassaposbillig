/**
 * SHARED HELPERS
 */

/** Format number to 2 decimal places string */
export function fmt2(val) {
  const n = parseFloat(val) || 0;
  return n.toFixed(2);
}

/** Format number with Indian locale commas */
export function fmtINR(val) {
  const n = parseFloat(val) || 0;
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Convert date string to dd/MM/yyyy display */
export function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Today as yyyy-MM-dd */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/** Add days to a date string */
export function addDays(dateStr, days) {
  const d = new Date(dateStr || new Date());
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Clamp a number between min/max */
export function clamp(val, min, max) {
  return Math.min(Math.max(parseFloat(val) || 0, min), max);
}

/** Show toast notification (uses custom event) */
export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('kassa-toast', { detail: { message, type } }));
}

/** Keyboard shortcut label map */
export const KEY_LABELS = {
  F1: 'Save',
  F2: 'Free Product',
  F3: 'Edit',
  F5: 'View',
  F9: 'Delete',
  Escape: 'Exit',
};
