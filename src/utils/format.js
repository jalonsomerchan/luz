export function euroKwh(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value.toLocaleString('es-ES', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} €/kWh`;
}

export function centsKwh(value) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c€/kWh`;
}

export function compactCents(value) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} c€`;
}

export function percent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value.toLocaleString('es-ES', { maximumFractionDigits: 1 })}%`;
}

export function hourLabel(hour) {
  const start = String(hour).padStart(2, '0');
  const end = String((hour + 1) % 24).padStart(2, '0');
  return `${start}:00-${end}:00`;
}
