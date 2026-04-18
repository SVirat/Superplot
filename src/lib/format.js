const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const DATE_FMT = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function formatCurrency(n) {
  if (n == null) return '—';
  return INR.format(n);
}

export function formatDate(d) {
  if (!d) return '—';
  return DATE_FMT.format(new Date(d));
}

export function formatNumber(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-IN');
}
