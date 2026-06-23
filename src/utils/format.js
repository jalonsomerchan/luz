function formatEuro(value, options = {}) {
  if (!Number.isFinite(value)) return '—';
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;
  return value.toLocaleString('es-ES', { minimumFractionDigits, maximumFractionDigits });
}

export function euroKwh(value) {
  if (!Number.isFinite(value)) return '—';
  return formatEuro(value) + ' €/kWh';
}

export function centsKwh(value) {
  if (!Number.isFinite(value)) return '—';
  return formatEuro(value) + ' €/kWh';
}

export function compactCents(value) {
  if (!Number.isFinite(value)) return '—';
  return formatEuro(value) + ' €';
}

export function percent(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + '%';
}

export function hourLabel(hour) {
  const start = String(hour).padStart(2, '0');
  const end = String((hour + 1) % 24).padStart(2, '0');
  return start + ':00-' + end + ':00';
}
