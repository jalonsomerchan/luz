import { CACHE_TTL_MS, DEFAULT_API_BASE } from '../config/constants.js';
import { hourLabel } from '../utils/format.js';
import { normalizePeriod } from '../utils/electricity.js';

function runtimeConfig() {
  return window.LUZ_CONFIG || {};
}

function apiBase() {
  const config = runtimeConfig();
  return (config.apiBase || config.API_BASE_URL || DEFAULT_API_BASE).replace(/\/+$/, '');
}

function cacheKey(date) {
  return `luz:day:${date}`;
}

function readCache(date) {
  try {
    const raw = localStorage.getItem(cacheKey(date));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (!cached || Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function writeCache(date, data) {
  try {
    localStorage.setItem(cacheKey(date), JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // La app funciona aunque localStorage no esté disponible.
  }
}

function configuredDayEndpoints(date) {
  const config = runtimeConfig();
  if (Array.isArray(config.dayEndpoints) && config.dayEndpoints.length) {
    return config.dayEndpoints.map((endpoint) => ({
      path: endpoint.path || '',
      params: Object.fromEntries(Object.entries(endpoint.params || {}).map(([key, value]) => [key, String(value).replaceAll('{date}', date)]))
    }));
  }

  return [
    { path: '', params: { fecha: date } },
    { path: '', params: { date } },
    { path: 'dia', params: { fecha: date } },
    { path: 'dia', params: { date } },
    { path: 'precios', params: { fecha: date } },
    { path: 'precios', params: { date } },
    { path: 'precio', params: { fecha: date } },
    { path: 'pvpc', params: { fecha: date } }
  ];
}

function buildUrl(endpoint, params = {}) {
  const path = String(endpoint || '').replace(/^\/+/, '');
  const url = new URL(path ? `${apiBase()}/${path}` : `${apiBase()}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url;
}

async function request(endpoint, params = {}) {
  const response = await fetch(buildUrl(endpoint, params), { headers: { Accept: 'application/json' } });
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

  const nestedObject = candidates.find((candidate) => candidate && typeof candidate === 'object');
  if (nestedObject) return unwrapPayload(nestedObject);

  const hourEntries = Object.entries(payload)
    .filter(([key, value]) => value && typeof value === 'object' && /\d{1,2}/.test(key))
    .map(([key, value]) => ({ hora: value.hour || value.hora || key, ...value }));
  if (hourEntries.length) return hourEntries;

  if ('precio' in payload || 'price' in payload || 'value' in payload || 'PVPC' in payload) return [payload];
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

function parseHour(value, fallbackIndex) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(23, Math.trunc(value)));
  const text = String(value || '').trim();
  const match = text.match(/(^|\D)(\d{1,2})(?=[:h\-\s]|$)/i);
  if (match) return Math.max(0, Math.min(23, Number(match[2])));
  return fallbackIndex;
}

function extractRawPrice(item) {
  const fields = [
    item.priceKwh,
    item.price_kwh,
    item.precio_kwh,
    item.precioKwh,
    item.precio,
    item.price,
    item.value,
    item.valor,
    item.PVPC,
    item.pvpc,
    item.coste,
    item.amount
  ];
  return fields.map(parseNumber).find((value) => Number.isFinite(value));
}

function looksLikeMwh(value, item) {
  const unit = String(item.unit || item.unidad || item.units || '').toLowerCase();
  if (unit.includes('mwh')) return true;
  if (unit.includes('kwh')) return false;
  return value > 5;
}

function normalizeItem(item, index, requestedDate) {
  const hour = parseHour(item.hour ?? item.hora ?? item.time ?? item.periodo_hora ?? item.name ?? item.label, index);
  const rawPrice = extractRawPrice(item);
  const priceKwh = Number.isFinite(rawPrice) ? (looksLikeMwh(rawPrice, item) ? rawPrice / 1000 : rawPrice) : NaN;
  const date = item.date || item.fecha || item.day || requestedDate;
  const period = normalizePeriod(item.period || item.periodo || item.tramo || item.tarifa, hour, requestedDate);

  return {
    date,
    hour,
    label: item.label || item.hora || item.hour || hourLabel(hour),
    priceKwh,
    rawPrice,
    period,
    source: item
  };
}

function normalizeDay(payload, requestedDate) {
  const rows = unwrapPayload(payload)
    .map((item, index) => normalizeItem(item, index, requestedDate))
    .filter((item) => item.hour >= 0 && item.hour <= 23 && Number.isFinite(item.priceKwh));

  const byHour = new Map();
  rows.forEach((item) => byHour.set(item.hour, item));

  return [...byHour.values()].sort((a, b) => a.hour - b.hour);
}

async function fetchDay(date) {
  const endpoints = configuredDayEndpoints(date);
  const errors = [];

  for (const endpoint of endpoints) {
    try {
      const payload = await request(endpoint.path, endpoint.params);
      const normalized = normalizeDay(payload, date);
      if (normalized.length) return normalized;
      errors.push('Respuesta sin precios horarios');
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(errors.at(-1) || 'La API no ha devuelto precios para este día.');
}

export const Api = {
  async day(date, { force = false } = {}) {
    if (!force) {
      const cached = readCache(date);
      if (cached) return cached;
    }
    const data = await fetchDay(date);
    writeCache(date, data);
    return data;
  },
  async days(dates) {
    const settled = await Promise.allSettled(dates.map((date) => this.day(date)));
    return settled.map((result, index) => ({
      date: dates[index],
      ok: result.status === 'fulfilled',
      items: result.status === 'fulfilled' ? result.value : [],
      error: result.status === 'rejected' ? result.reason?.message : null
    }));
  },
  clearCache() {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('luz:day:'))
      .forEach((key) => localStorage.removeItem(key));
  }
};
