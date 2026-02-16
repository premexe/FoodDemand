const DATASET_KEY = 'fooddemand.dataset.v1';
const HISTORY_KEY = 'fooddemand.upload.history.v1';
export const DATASET_EVENT = 'fd-dataset-updated';

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function toDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeRows(rawRows, mapping) {
  return rawRows
    .map((row) => {
      const dateRaw = row[mapping.date];
      const itemNameRaw = row[mapping.itemName];
      const quantityRaw = row[mapping.quantity];
      const revenueRaw = mapping.revenue ? row[mapping.revenue] : '';

      const dayKey = toDayKey(dateRaw);
      const itemName = String(itemNameRaw || '').trim();
      const quantity = toNumber(quantityRaw);
      const revenue = toNumber(revenueRaw);

      if (!dayKey || !itemName || quantity === null || quantity < 0) {
        return null;
      }

      return {
        date: dayKey,
        itemName,
        quantity,
        revenue: revenue !== null && revenue >= 0 ? revenue : null,
      };
    })
    .filter(Boolean);
}

function userScope(userId) {
  const safe = String(userId || '').trim().toLowerCase();
  return safe || 'anonymous';
}

function readScoped(key) {
  const raw = safeParse(localStorage.getItem(key), {});
  return raw && typeof raw === 'object' ? raw : {};
}

function writeScoped(key, payload) {
  localStorage.setItem(key, JSON.stringify(payload));
}

export function saveDatasetForUser(userId, payload) {
  const scope = userScope(userId);
  const datasets = readScoped(DATASET_KEY);
  datasets[scope] = payload;
  writeScoped(DATASET_KEY, datasets);
  window.dispatchEvent(new CustomEvent(DATASET_EVENT, { detail: { userId: scope } }));
}

export function loadDatasetForUser(userId) {
  const scope = userScope(userId);
  const datasets = readScoped(DATASET_KEY);
  return datasets[scope] || null;
}

export function clearDatasetForUser(userId) {
  const scope = userScope(userId);
  const datasets = readScoped(DATASET_KEY);
  delete datasets[scope];
  writeScoped(DATASET_KEY, datasets);
  window.dispatchEvent(new CustomEvent(DATASET_EVENT, { detail: { userId: scope } }));
}

export function loadUploadHistoryForUser(userId) {
  const scope = userScope(userId);
  const historyStore = readScoped(HISTORY_KEY);
  const list = historyStore[scope];
  return Array.isArray(list) ? list : [];
}

export function appendUploadHistoryForUser(userId, record, limit = 20) {
  const scope = userScope(userId);
  const historyStore = readScoped(HISTORY_KEY);
  const current = Array.isArray(historyStore[scope]) ? historyStore[scope] : [];
  historyStore[scope] = [record, ...current].slice(0, limit);
  writeScoped(HISTORY_KEY, historyStore);
}

export function removeUploadHistoryEntriesForUser(userId, entryIds) {
  const scope = userScope(userId);
  const historyStore = readScoped(HISTORY_KEY);
  const current = Array.isArray(historyStore[scope]) ? historyStore[scope] : [];
  const ids = new Set((Array.isArray(entryIds) ? entryIds : []).map((id) => String(id)));
  historyStore[scope] = current.filter((entry) => !ids.has(String(entry?.id || '')));
  writeScoped(HISTORY_KEY, historyStore);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

export function summarizeDataset(dataset) {
  const rows = Array.isArray(dataset?.rows) ? dataset.rows : [];
  if (!rows.length) {
    return null;
  }

  const dailyMap = new Map();
  const dailyRevenueMap = new Map();
  const itemTotals = new Map();
  const itemByDate = new Map();
  let revenueKnown = true;

  rows.forEach((row) => {
    dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + row.quantity);
    if (row.revenue === null) {
      revenueKnown = false;
    } else {
      dailyRevenueMap.set(row.date, (dailyRevenueMap.get(row.date) || 0) + row.revenue);
    }

    itemTotals.set(row.itemName, (itemTotals.get(row.itemName) || 0) + row.quantity);

    const itemDateKey = `${row.itemName}::${row.date}`;
    itemByDate.set(itemDateKey, (itemByDate.get(itemDateKey) || 0) + row.quantity);
  });

  const dailySeries = Array.from(dailyMap.entries())
    .map(([date, demand]) => ({
      date,
      demand,
      revenue: dailyRevenueMap.get(date) || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const demandValues = dailySeries.map((item) => item.demand);
  const totalDemand = demandValues.reduce((sum, value) => sum + value, 0);
  const totalRevenue = revenueKnown ? dailySeries.reduce((sum, item) => sum + item.revenue, 0) : null;
  const avgDailyDemand = average(demandValues);

  const variance = average(demandValues.map((value) => (value - avgDailyDemand) ** 2));
  const stdDev = Math.sqrt(variance);
  const volatility = avgDailyDemand > 0 ? (stdDev / avgDailyDemand) * 100 : 0;

  const topItems = Array.from(itemTotals.entries())
    .map(([itemName, qty]) => ({ itemName, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6);

  const prepRecommendations = topItems.slice(0, 5).map((item) => {
    const dailyForItem = dailySeries
      .map((day) => itemByDate.get(`${item.itemName}::${day.date}`) || 0);
    const recentWindow = dailyForItem.slice(-7);
    const recentAvg = average(recentWindow.length ? recentWindow : dailyForItem);
    const suggestedPrep = Math.ceil(recentAvg * 1.05);

    return {
      item: item.itemName,
      historicalTotal: item.qty,
      suggestedPrep,
      confidence: Math.max(65, Math.min(95, Math.round(100 - volatility / 2))),
    };
  });

  const dayToDayChange = dailySeries.map((entry, index) => {
    if (index === 0) return 0;
    return Math.abs(entry.demand - dailySeries[index - 1].demand);
  });

  return {
    totalRows: rows.length,
    totalDemand,
    totalRevenue,
    dataDays: dailySeries.length,
    avgDailyDemand,
    volatility,
    distinctItems: itemTotals.size,
    dailySeries,
    topItems,
    prepRecommendations,
    dayToDayChange,
  };
}
