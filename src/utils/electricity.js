import { PERIODS } from '../config/constants.js';

export function periodForHour(hour, isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  const weekDay = date.getDay();
  if (weekDay === 0 || weekDay === 6) return 'P3';
  if ((hour >= 10 && hour < 14) || (hour >= 18 && hour < 22)) return 'P1';
  if ((hour >= 8 && hour < 10) || (hour >= 14 && hour < 18) || hour >= 22) return 'P2';
  return 'P3';
}

export function normalizePeriod(value, hour, isoDate) {
  const raw = String(value || '').trim().toUpperCase();
  if (raw.includes('P1') || raw.includes('PUNTA')) return 'P1';
  if (raw.includes('P2') || raw.includes('LLANO')) return 'P2';
  if (raw.includes('P3') || raw.includes('VALLE')) return 'P3';
  return periodForHour(hour, isoDate);
}

export function periodMeta(period) {
  return PERIODS[period] || PERIODS.P2;
}

export function analyzeDay(items = []) {
  const valid = items.filter((item) => Number.isFinite(item.priceKwh));
  if (!valid.length) return null;
  const prices = valid.map((item) => item.priceKwh);
  const total = prices.reduce((sum, price) => sum + price, 0);
  const min = valid.reduce((best, item) => item.priceKwh < best.priceKwh ? item : best, valid[0]);
  const max = valid.reduce((worst, item) => item.priceKwh > worst.priceKwh ? item : worst, valid[0]);
  const byPeriod = Object.keys(PERIODS).reduce((acc, period) => {
    const periodItems = valid.filter((item) => item.period === period);
    const average = periodItems.length
      ? periodItems.reduce((sum, item) => sum + item.priceKwh, 0) / periodItems.length
      : null;
    acc[period] = { count: periodItems.length, average };
    return acc;
  }, {});

  return {
    count: valid.length,
    average: total / valid.length,
    min,
    max,
    spread: max.priceKwh - min.priceKwh,
    byPeriod
  };
}

export function cheapestHours(items = [], limit = 4) {
  return items
    .filter((item) => Number.isFinite(item.priceKwh))
    .sort((a, b) => a.priceKwh - b.priceKwh)
    .slice(0, limit);
}

export function bestConsecutiveBlock(items = [], length = 3) {
  const valid = [...items].filter((item) => Number.isFinite(item.priceKwh)).sort((a, b) => a.hour - b.hour);
  if (valid.length < length) return null;
  let best = null;
  for (let index = 0; index <= valid.length - length; index += 1) {
    const block = valid.slice(index, index + length);
    const consecutive = block.every((item, innerIndex) => innerIndex === 0 || item.hour === block[innerIndex - 1].hour + 1);
    if (!consecutive) continue;
    const average = block.reduce((sum, item) => sum + item.priceKwh, 0) / length;
    if (!best || average < best.average) best = { items: block, average, start: block[0], end: block[block.length - 1] };
  }
  return best;
}

export function analyzeRange(days = []) {
  const dayStats = days
    .map((day) => ({ date: day.date, items: day.items || [], stats: analyzeDay(day.items || []) }))
    .filter((day) => day.stats);
  const allItems = dayStats.flatMap((day) => day.items.map((item) => ({ ...item, date: day.date })));
  const stats = analyzeDay(allItems);
  if (!stats) return null;

  const cheapestDay = dayStats.reduce((best, day) => day.stats.average < best.stats.average ? day : best, dayStats[0]);
  const expensiveDay = dayStats.reduce((worst, day) => day.stats.average > worst.stats.average ? day : worst, dayStats[0]);

  return {
    ...stats,
    dayStats,
    cheapestDay,
    expensiveDay,
    cheapestHours: cheapestHours(allItems, 10),
    days: dayStats.length,
    hours: allItems.length
  };
}

export function consumptionCost(items = [], kwh = 1) {
  const stats = analyzeDay(items);
  return stats ? stats.average * kwh : null;
}
