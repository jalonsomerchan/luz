import { CACHE_TTL_MS, DEFAULT_API_BASE } from '../config/constants.js';
import { todayIso } from '../utils/dates.js';
import { hourLabel } from '../utils/format.js';
import { normalizePeriod } from '../utils/electricity.js';

function runtimeConfig() {
  return window.LUZ_CONFIG || {};
}

function apiBase() {
  const config = runtimeConfig();
  return (config.apiBase || config.API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '');
}

function cacheKey(kind, params = {}) {
  return `luz:${kind}:${JSON.stringify(params)}`;
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // La app funciona aunque localStorage no esté disponible.
  }
}

function cleanAuthValue(value) {
  const text = String(value ?? '').trim();
  return ['none', 'false', 'off', 'query'].includes(text.toLowerCase()) ? '' : text;
}

function apiKeyConfig() {
  const config = runtimeConfig();
  const header = cleanAuthValue(config.apiKeyHeader ?? config.API_KEY_HEADER ?? 'Authorization');
  const authScheme = cleanAuthValue(config.authScheme ?? config.AUTH_SCHEME ?? (header.toLowerCase() === 'authorization' ? 'Bearer' : ''));
  return {
    key: config.apiKey || config.API_KEY || '',
    param: config.apiKeyParam ?? config.API_KEY_PARAM ?? '',
    header,
    authScheme
  };
}

function buildUrl(endpoint, params = {}) {
  const path = String(endpoint || '').replace(/^\/+/, '');
  const url = new URL(path ? `${apiBase()}/${path}` : `${apiBase()}/`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });

  const { key, param, header, authScheme } = apiKeyConfig();
  const useQueryAuth = key && param && !header && !authScheme;
  if (useQueryAuth && !url.searchParams.has(param)) {
    url.searchParams.set(param, key);
  }

  return url;
}

function requestHeaders() {
  const headers = { Accept: 'application/json' };
  const { key, header, authScheme } = apiKeyConfig();
  if (!key || !header) return headers;
  headers[header] = authScheme ? `${authScheme} ${key}`.trim() : key;
  return headers;
}

async function request(endpoint, params = {}) {
  const response = await fetch(buildUrl(endpoint, params), { headers: requestHeaders() });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.error) {
    throw new Error(data?.msg || data?.message || `Error ${response.status} consultando la API`);
  }
  return data;
}

function unwrapPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const candidates = [payload.data, payload.precios, payload.prices, payload.items, payload.result, payload.results, payload.valores, payload.values];
  const array = candidates.find(Array.isArray);
  if (array) return array;
  if ('fecha_hora' in payload || 'valor' in payload || 'precio' in payload || 'price' in payload || 'value' in payload || 'PVPC' in payload) return [payload];
  return [];
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  let cleaned = value
    .replace(/€/g, '')
    .replace(/MWh|kWh|c€/gi, '')
    .replace(/\s+/g, '')
    .trim();

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  if (hasComma && hasDot) cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  else if (hasComma) cleaned = cleaned.replace(',', '.');

  return Number(cleaned);
}

function parseDateTime(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2})/);
  if (!match) return { date: '', hour: NaN };
  return { date: match[1], hour: Number(match[2]) };
}

function parseHour(value, fallbackIndex, fechaHora) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(23, Math.trunc(value)));
  const dateTime = parseDateTime(fechaHora);
  if (Number.isFinite(dateTime.hour)) return Math.max(0, Math.min(23, dateTime.hour));
  const text = String(value || '').trim();
  const match = text.match(/(^|\D)(\d{1,2})(?=[:h\-\s]|$)/i);
  if (match) return Math.max(0, Math.min(23, Number(match[2])));
  return fallbackIndex;
}

function rawPriceUnit(item, rawPrice) {
  const config = runtimeConfig();
  const configured = String(config.valorUnit || config.priceUnit || '').toLowerCase();
  if (configured) return configured;

  const unit = String(item.unit || item.unidad || item.units || '').toLowerCase();
  if (unit.includes('mwh')) return 'eur_mwh';
  if (unit.includes('kwh')) return 'eur_kwh';
  if (unit.includes('cent') || unit.includes('c€')) return 'cent_kwh';

  // La API luz.php expone el campo `valor`. En mercados PVPC suele venir en €/MWh.
  // Si supera 5, lo tratamos como €/MWh y lo convertimos a €/kWh.
  return rawPrice > 5 ? 'eur_mwh' : 'eur_kwh';
}

function priceToKwh(rawPrice, item) {
  if (!Number.isFinite(rawPrice)) return NaN;
  const unit = rawPriceUnit(item, rawPrice);
  if (unit === 'eur_mwh' || unit === 'mwh') return rawPrice / 1000;
  if (unit === 'cent_kwh' || unit === 'centimos_kwh' || unit === 'cents_kwh') return rawPrice / 100;
  return rawPrice;
}

function extractRawPrice(item) {
  const fields = [
    item.valor,
    item.priceKwh,
    item.price_kwh,
    item.precio_kwh,
    item.precioKwh,
    item.precio,
    item.price,
    item.value,
    item.PVPC,
    item.pvpc,
    item.coste,
    item.amount
  ];
  return fields.map(parseNumber).find((value) => Number.isFinite(value));
}

function normalizeItem(item, index = 0, requestedDate = todayIso()) {
  const dateTime = parseDateTime(item.fecha_hora || item.datetime || item.date_time || item.time_start);
  const date = item.fecha || item.date || item.day || dateTime.date || requestedDate;
  const hour = parseHour(item.hora ?? item.hour ?? item.time ?? item.periodo_hora ?? item.name ?? item.label, index, item.fecha_hora || item.datetime || item.date_time);
  const rawPrice = extractRawPrice(item);
  const priceKwh = priceToKwh(rawPrice, item);
  const period = normalizePeriod(item.tramo || item.period || item.periodo || item.tarifa, hour, date);

  return {
    date,
    hour,
    fechaHora: item.fecha_hora || `${date} ${String(hour).padStart(2, '0')}:00:00`,
    label: item.label || item.hora || item.hour || hourLabel(hour),
    priceKwh,
    rawPrice,
    period,
    source: item
  };
}

function normalizeRows(payload, requestedDate = todayIso()) {
  return unwrapPayload(payload)
    .map((item, index) => normalizeItem(item, index, requestedDate))
    .filter((item) => item.hour >= 0 && item.hour <= 23 && Number.isFinite(item.priceKwh))
    .sort((a, b) => `${a.date} ${String(a.hour).padStart(2, '0')}`.localeCompare(`${b.date} ${String(b.hour).padStart(2, '0')}`));
}

function normalizeDay(payload, requestedDate = todayIso()) {
  const byHour = new Map();
  normalizeRows(payload, requestedDate).forEach((item) => byHour.set(item.hour, item));
  return [...byHour.values()].sort((a, b) => a.hour - b.hour);
}

function normalizeStats(stats) {
  if (!stats || typeof stats !== 'object') return null;
  const priceFields = ['media_valor', 'min_valor', 'max_valor'];
  const normalized = { ...stats };
  priceFields.forEach((field) => {
    const raw = parseNumber(stats[field]);
    normalized[field] = raw;
    normalized[`${field}_kwh`] = priceToKwh(raw, { valor: raw });
  });
  ['total_registros', 'total_dias', 'total_tramos'].forEach((field) => {
    if (field in normalized) normalized[field] = Number(normalized[field]);
  });
  return normalized;
}

function normalizePeriodStats(rows) {
  return unwrapPayload(rows).map((row) => normalizeStats(row)).filter(Boolean);
}

function dateRangeParams(fechaDesde, fechaHasta, extra = {}) {
  return {
    fecha_desde: fechaDesde,
    fecha_hasta: fechaHasta,
    ...extra
  };
}

async function cached(kind, params, loader, { force = false } = {}) {
  const key = cacheKey(kind, params);
  if (!force) {
    const cachedData = readCache(key);
    if (cachedData) return cachedData;
  }
  const data = await loader();
  writeCache(key, data);
  return data;
}

export const Api = {
  async today(options = {}) {
    return cached('hoy', {}, async () => normalizeDay(await request('hoy'), todayIso()), options);
  },

  async current(options = {}) {
    return cached('actual', {}, async () => {
      const rows = normalizeRows(await request('actual'), todayIso());
      return rows[0] || null;
    }, options);
  },

  async day(date = todayIso(), options = {}) {
    const endpoint = date === todayIso() ? 'hoy' : 'fecha';
    const params = endpoint === 'fecha' ? { fecha: date } : {};
    return cached(`dia:${endpoint}`, { date }, async () => normalizeDay(await request(endpoint, params), date), options);
  },

  async range(fechaDesde, fechaHasta, { tramo = '', limit = 5000, page = 1, force = false } = {}) {
    const params = dateRangeParams(fechaDesde, fechaHasta, { tramo, limit, page });
    return cached('rango', params, async () => normalizeRows(await request('rango', params), fechaDesde), { force });
  },

  async extremes({ fecha = '', fechaDesde = '', fechaHasta = '', limit = 5, force = false } = {}) {
    const params = fecha ? { fecha, limit } : dateRangeParams(fechaDesde || todayIso(), fechaHasta || fechaDesde || todayIso(), { limit });
    return cached('extremos', params, async () => {
      const payload = await request('extremos', params);
      return {
        baratos: normalizeRows(payload.baratos || [], fecha || fechaDesde || todayIso()),
        caros: normalizeRows(payload.caros || [], fecha || fechaDesde || todayIso())
      };
    }, { force });
  },

  async statistics(fechaDesde, fechaHasta, { tramo = '', force = false } = {}) {
    const params = dateRangeParams(fechaDesde, fechaHasta, { tramo });
    return cached('estadisticas', params, async () => normalizeStats(await request('estadisticas', params)), { force });
  },

  async periods(fechaDesde, fechaHasta, { force = false } = {}) {
    const params = dateRangeParams(fechaDesde, fechaHasta);
    return cached('tramos', params, async () => normalizePeriodStats(await request('tramos', params)), { force });
  },

  async historical(group = 'fecha', fechaDesde = todayIso(), fechaHasta = todayIso(), { limit = 5000, page = 1, force = false } = {}) {
    const params = dateRangeParams(fechaDesde, fechaHasta, { group, limit, page });
    return cached('historico', params, async () => {
      const payload = await request('historico', params);
      return {
        page: Number(payload.page || page),
        limit: Number(payload.limit || limit),
        group: payload.group || group,
        data: normalizePeriodStats(payload.data || [])
      };
    }, { force });
  },

  async trend(periodo = 'dia', options = {}) {
    return cached('tendencia', { periodo }, async () => request('tendencia', { periodo }), options);
  },

  async days(dates, options = {}) {
    if (!dates?.length) return [];
    const sorted = [...dates].sort();
    const items = await this.range(sorted[0], sorted[sorted.length - 1], options);
    const byDate = new Map();
    items.forEach((item) => {
      if (!byDate.has(item.date)) byDate.set(item.date, []);
      byDate.get(item.date).push(item);
    });
    return dates.map((date) => ({ date, ok: byDate.has(date), items: byDate.get(date) || [], error: byDate.has(date) ? null : 'Sin datos' }));
  },

  clearCache() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('luz:'))
      .forEach((key) => localStorage.removeItem(key));
  }
};
