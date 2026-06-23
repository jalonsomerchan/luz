export function toIsoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(isoDate, days) {
  const date = parseIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function dateLabel(isoDate, options = {}) {
  return parseIsoDate(isoDate).toLocaleDateString('es-ES', {
    weekday: options.weekday || 'short',
    day: 'numeric',
    month: options.month || 'short',
    year: options.year || undefined
  });
}

export function longDateLabel(isoDate) {
  return parseIsoDate(isoDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function currentHour() {
  return new Date().getHours();
}

export function startOfWeek(isoDate = todayIso()) {
  const date = parseIsoDate(isoDate);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return toIsoDate(date);
}

export function weekDates(isoDate = todayIso()) {
  const start = startOfWeek(isoDate);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function monthDates(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  const days = new Date(year, month, 0).getDate();
  return Array.from({ length: days }, (_, index) => toIsoDate(new Date(year, month - 1, index + 1)));
}

export function currentYearMonth() {
  return todayIso().slice(0, 7);
}

export function lastNDates(days) {
  const today = todayIso();
  return Array.from({ length: days }, (_, index) => addDays(today, index - days + 1));
}
