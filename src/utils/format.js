export function euroKwh(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('es-ES') + ' €/kWh';
}
