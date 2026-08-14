export function fmt(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Math.round(n || 0));
}

export function fmtShort(n: number): string {
  return n >= 1000 ? Math.round(n / 100) / 10 + 'k' : String(Math.round(n));
}
