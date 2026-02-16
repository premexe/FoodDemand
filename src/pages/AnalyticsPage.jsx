import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import AuthenticatedSectionLayout from '../components/AuthenticatedSectionLayout';
import { getCurrentUser } from '../auth/auth';
import { DATASET_EVENT, loadDatasetForUser, summarizeDataset } from '../utils/datasetStore';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FORECAST_API_BASE = (import.meta.env.VITE_FORECAST_API_URL || '').trim().replace(/\/$/, '');
const FORECAST_API_KEY = (import.meta.env.VITE_FORECAST_API_KEY || '').trim();

function chartSx(theme) {
  const labelColor = theme.text;
  return {
    '& .MuiChartsAxis-root .MuiChartsAxis-line': { stroke: theme.border },
    '& .MuiChartsAxis-root .MuiChartsAxis-tick': { stroke: theme.border },
    '& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-label': {
      fill: `${labelColor} !important`,
      color: `${labelColor} !important`,
      fontSize: 11,
    },
    '& .MuiChartsAxis-tickLabel tspan, & .MuiChartsLegend-label tspan': {
      fill: `${labelColor} !important`,
    },
    '& .MuiChartsAxis-label': {
      fill: `${labelColor} !important`,
      color: `${labelColor} !important`,
    },
    '& .MuiChartsGrid-line': { stroke: theme.border },
    '& .MuiChartsLegend-root, & .MuiChartsLegend-root *': {
      color: `${labelColor} !important`,
      fill: `${labelColor} !important`,
    },
    '& .MuiChartsTooltip-root, & .MuiChartsTooltip-root *': {
      color: `${labelColor} !important`,
      fill: `${labelColor} !important`,
    },
  };
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compressSeries(series, maxPoints = 24) {
  if (series.length <= maxPoints) {
    return series.map((item) => ({ label: item.date.slice(5), demand: item.demand, revenue: item.revenue || 0 }));
  }

  const bucketSize = Math.ceil(series.length / maxPoints);
  const output = [];

  for (let i = 0; i < series.length; i += bucketSize) {
    const bucket = series.slice(i, i + bucketSize);
    output.push({
      label: bucket[bucket.length - 1].date.slice(5),
      demand: Math.round(average(bucket.map((item) => item.demand))),
      revenue: Math.round(average(bucket.map((item) => item.revenue || 0))),
    });
  }

  return output;
}

function buildAnalytics(summary, datasetRows) {
  const compressed = compressSeries(summary.dailySeries, 24);

  const weekdayBuckets = new Map();
  const itemDaily = new Map();

  datasetRows.forEach((row) => {
    const weekday = new Date(`${row.date}T00:00:00`).getDay();
    weekdayBuckets.set(weekday, (weekdayBuckets.get(weekday) || 0) + row.quantity);

    if (!itemDaily.has(row.itemName)) {
      itemDaily.set(row.itemName, []);
    }
    itemDaily.get(row.itemName).push({ date: row.date, quantity: row.quantity });
  });

  const weekdayPattern = WEEKDAY_LABELS.map((label, index) => ({
    day: label,
    qty: weekdayBuckets.get(index) || 0,
  }));

  const instability = Array.from(itemDaily.entries()).map(([itemName, points]) => {
    const values = points.map((point) => point.quantity);
    const mean = average(values);
    const variance = average(values.map((value) => (value - mean) ** 2));
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;
    return { itemName, cv, total: values.reduce((sum, value) => sum + value, 0) };
  });

  const topInstability = instability
    .sort((a, b) => b.cv - a.cv)
    .slice(0, 5)
    .map((item, index) => ({
      id: index,
      value: Math.round(item.cv),
      label: item.itemName,
      color: ['#f59e0b', '#f97316', '#fb7185', '#00df8c', '#5eead4'][index],
    }));

  const demandChanges = summary.dayToDayChange;
  const avgChange = average(demandChanges);
  const highChangeDays = demandChanges.filter((value) => value > avgChange * 1.4).length;

  const recommendations = [];
  if (summary.volatility > 30) {
    recommendations.push({
      pillar: 'Operations',
      action: 'Use a tighter prep cycle on high-variance days and reduce large batch cooking.',
      impact: `Volatility ${summary.volatility.toFixed(1)}% indicates unstable daily demand.`,
    });
  }

  if (topInstability.length > 0) {
    recommendations.push({
      pillar: 'Inventory',
      action: `Monitor ${topInstability[0].label} closely with lower safety buffer after non-peak hours.`,
      impact: `Highest item variability score: ${topInstability[0].value}.`,
    });
  }

  if (summary.totalRevenue !== null) {
    const avgRevenue = summary.totalRevenue / summary.dataDays;
    recommendations.push({
      pillar: 'Revenue',
      action: 'Prioritize production on top-demand days and cut low-rotation late batches.',
      impact: `Average daily revenue is ${formatCurrency(avgRevenue)}.`,
    });
  }

  recommendations.push({
    pillar: 'Planning',
    action: `${highChangeDays} days show sharp demand shifts. Build day-specific prep plans instead of fixed daily quantities.`,
    impact: 'Improves service consistency and reduces stockout/waste oscillations.',
  });

  return {
    compressed,
    weekdayPattern,
    topInstability,
    recommendations,
    highChangeDays,
  };
}

function addDaysToIsoDate(baseDate, daysToAdd) {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().slice(0, 10);
}

function aggregateDailyDemand(rows) {
  const map = new Map();
  rows.forEach((row) => {
    map.set(row.date, (map.get(row.date) || 0) + row.quantity);
  });
  return Array.from(map.entries())
    .map(([date, demand]) => ({ date, demand }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildForecastPayload(rows, selectedItem, horizonDays) {
  const scopedRows = rows.slice(-500);
  return {
    horizonDays,
    selectedItem: selectedItem === 'all' ? null : selectedItem,
    dailySeries: aggregateDailyDemand(scopedRows),
    rows: scopedRows,
  };
}

function normalizeForecastResponse(data, startDate, horizonDays) {
  const possibleArrays = [data?.forecast, data?.predictions, data?.data, Array.isArray(data) ? data : null];
  const source = possibleArrays.find((entry) => Array.isArray(entry)) || [];

  if (!source.length) return [];

  if (source.every((entry) => Number.isFinite(Number(entry)))) {
    return source.slice(0, horizonDays).map((value, index) => ({
      date: addDaysToIsoDate(startDate, index + 1),
      demand: Math.max(0, Math.round(Number(value))),
    }));
  }

  const normalized = source
    .map((entry, index) => {
      if (entry === null || typeof entry !== 'object') return null;
      const demandRaw = entry.demand ?? entry.prediction ?? entry.predicted ?? entry.yhat ?? entry.value ?? entry.qty ?? entry.quantity;
      const demand = Number(demandRaw);
      if (!Number.isFinite(demand)) return null;
      const dateRaw = entry.date ?? entry.day ?? entry.ds ?? entry.timestamp;
      const date = typeof dateRaw === 'string' ? dateRaw.slice(0, 10) : addDaysToIsoDate(startDate, index + 1);
      return {
        date,
        demand: Math.max(0, Math.round(demand)),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));

  return normalized.slice(0, horizonDays);
}

function inferIntent(text, context) {
  const prompt = String(text || '').trim().toLowerCase();
  if (!prompt) {
    return 'Ask me about demand trend, unstable items, revenue impact, or planning recommendations.';
  }

  if (['hi', 'hello', 'hey'].includes(prompt)) {
    return 'Hi. I am using your imported dataset to answer planning questions.';
  }

  if (prompt.includes('trend') || prompt.includes('demand')) {
    return `Your data spans ${context.summary.dataDays} days with average demand ${formatNumber(context.summary.avgDailyDemand)} and volatility ${context.summary.volatility.toFixed(1)}%.`;
  }

  if (prompt.includes('waste') || prompt.includes('unstable') || prompt.includes('risk')) {
    if (!context.analytics.topInstability.length) {
      return 'No high-instability items detected from current data.';
    }
    return `${context.analytics.topInstability[0].label} shows the highest instability. Start by tightening prep buffer on that item.`;
  }

  if (prompt.includes('revenue')) {
    if (context.summary.totalRevenue === null) {
      return 'Revenue column is not available in your dataset, so revenue-specific guidance is limited.';
    }
    return `Total revenue in dataset is ${formatCurrency(context.summary.totalRevenue)}. Focus capacity on days with high demand clusters.`;
  }

  return 'Ask more specifically, for example: "demand trend", "top unstable item", or "revenue guidance".';
}

export default function AnalyticsPage() {
  const reportRef = useRef(null);
  const user = getCurrentUser();
  const userId = user?.email || '';
  const [dataset, setDataset] = useState(() => loadDatasetForUser(userId));
  const [selectedItem, setSelectedItem] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Dataset-aware analytics assistant ready. Ask: demand trend, unstable items, or revenue guidance.' },
  ]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [horizonDays, setHorizonDays] = useState(7);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const [forecastError, setForecastError] = useState('');
  const [forecastRows, setForecastRows] = useState([]);

  useEffect(() => {
    const refresh = (event) => {
      const changedUser = event?.detail?.userId;
      if (!changedUser || changedUser === userId) {
        setDataset(loadDatasetForUser(userId));
      }
    };
    window.addEventListener(DATASET_EVENT, refresh);
    return () => window.removeEventListener(DATASET_EVENT, refresh);
  }, [userId]);

  useEffect(() => {
    setDataset(loadDatasetForUser(userId));
  }, [userId]);

  const datasetRows = useMemo(() => (Array.isArray(dataset?.rows) ? dataset.rows : []), [dataset]);

  const itemOptions = useMemo(() => {
    return Array.from(new Set(datasetRows.map((row) => row.itemName))).sort((a, b) => a.localeCompare(b));
  }, [datasetRows]);

  const dateBounds = useMemo(() => {
    if (!datasetRows.length) return { minDate: '', maxDate: '' };
    let minDate = datasetRows[0].date;
    let maxDate = datasetRows[0].date;
    datasetRows.forEach((row) => {
      if (row.date < minDate) minDate = row.date;
      if (row.date > maxDate) maxDate = row.date;
    });
    return { minDate, maxDate };
  }, [datasetRows]);

  useEffect(() => {
    if (selectedItem !== 'all' && !itemOptions.includes(selectedItem)) {
      setSelectedItem('all');
    }
  }, [selectedItem, itemOptions]);

  const filteredRows = useMemo(() => {
    return datasetRows.filter((row) => {
      if (selectedItem !== 'all' && row.itemName !== selectedItem) return false;
      if (startDate && row.date < startDate) return false;
      if (endDate && row.date > endDate) return false;
      return true;
    });
  }, [datasetRows, selectedItem, startDate, endDate]);

  const summary = useMemo(() => summarizeDataset({ rows: filteredRows }), [filteredRows]);
  const analytics = useMemo(() => {
    if (!summary) return null;
    return buildAnalytics(summary, filteredRows);
  }, [summary, filteredRows]);
  const hasDataset = datasetRows.length > 0;
  const filtersActive = selectedItem !== 'all' || Boolean(startDate) || Boolean(endDate);
  const lastObservedDate = useMemo(() => {
    if (!filteredRows.length) return new Date().toISOString().slice(0, 10);
    return filteredRows.reduce((maxDate, row) => (row.date > maxDate ? row.date : maxDate), filteredRows[0].date);
  }, [filteredRows]);

  useEffect(() => {
    setForecastRows([]);
    setForecastError('');
  }, [selectedItem, startDate, endDate, userId]);

  const clearFilters = () => {
    setSelectedItem('all');
    setStartDate('');
    setEndDate('');
  };

  const runForecast = async () => {
    if (!FORECAST_API_BASE) {
      setForecastError('Set VITE_FORECAST_API_URL in .env to enable live forecasts.');
      setForecastRows([]);
      return;
    }
    if (!filteredRows.length) {
      setForecastError('No filtered rows available to build forecast input.');
      setForecastRows([]);
      return;
    }

    setIsForecastLoading(true);
    setForecastError('');

    const payload = buildForecastPayload(filteredRows, selectedItem, horizonDays);
    const headers = { 'Content-Type': 'application/json' };
    if (FORECAST_API_KEY) {
      headers['x-api-key'] = FORECAST_API_KEY;
    }

    const paths = ['/forecast', '/predict'];
    let lastError = 'Forecast API request failed.';

    for (const path of paths) {
      try {
        const response = await fetch(`${FORECAST_API_BASE}${path}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          let message = `${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            if (typeof errorBody?.message === 'string' && errorBody.message.trim()) {
              message = errorBody.message;
            }
          } catch {
            // Keep HTTP status message.
          }
          lastError = `${path} failed: ${message}`;
          continue;
        }

        const body = await response.json();
        const normalized = normalizeForecastResponse(body, lastObservedDate, horizonDays);
        if (!normalized.length) {
          lastError = `${path} succeeded but returned no forecast rows.`;
          continue;
        }

        setForecastRows(normalized);
        setIsForecastLoading(false);
        return;
      } catch (error) {
        lastError = `${path} failed: ${error.message || 'Network error'}`;
      }
    }

    setForecastRows([]);
    setForecastError(lastError);
    setIsForecastLoading(false);
  };

  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed || !summary || !analytics) return;

    const reply = inferIntent(trimmed, { summary, analytics });
    setChatMessages((prev) => [...prev, { role: 'user', text: trimmed }, { role: 'assistant', text: reply }]);
    setChatInput('');
  };

  const handleExportPdf = async () => {
    if (!reportRef.current || isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: '#050607', useCORS: true });
      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth - 10;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 5;

      pdf.addImage(imageData, 'PNG', 5, position, imageWidth, imageHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight + 5;
        pdf.addPage();
        pdf.addImage(imageData, 'PNG', 5, position, imageWidth, imageHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`cookiq-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <AuthenticatedSectionLayout
      title="Analytics"
      subtitle="All analytics below are generated from your imported dataset."
    >
      {({ activeTheme, cardStyle }) => {
        if (!hasDataset) {
          return (
            <div className="rounded-3xl p-10 border text-center" style={cardStyle}>
              <div className="badge-neon w-fit mx-auto mb-4">No Dataset Imported</div>
              <h2 className="text-3xl font-black tracking-tight mb-3">Import Dataset To Enable Analytics</h2>
              <p className="max-w-2xl mx-auto text-sm" style={{ color: activeTheme.muted }}>
                Analytics runs only on imported data. Upload and import a dataset first.
              </p>
              <Link
                to="/upload"
                className="inline-block mt-6 px-6 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em]"
                style={{ ...cardStyle, textDecoration: 'none' }}
              >
                Go To Upload Data
              </Link>
            </div>
          );
        }

        if (!summary || !analytics) {
          return (
            <div className="space-y-6">
              <section className="rounded-3xl border p-6" style={cardStyle}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="badge-neon w-fit">Chart Filters</div>
                  <p className="text-xs font-semibold" style={{ color: activeTheme.muted }}>
                    Showing 0 of {formatNumber(datasetRows.length)} rows
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={selectedItem}
                    onChange={(event) => setSelectedItem(event.target.value)}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                  >
                    <option value="all" style={{ color: '#111', backgroundColor: '#fff' }}>All Items</option>
                    {itemOptions.map((item) => (
                      <option key={item} value={item} style={{ color: '#111', backgroundColor: '#fff' }}>{item}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={startDate}
                    min={dateBounds.minDate || undefined}
                    max={endDate || dateBounds.maxDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                  />
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || dateBounds.minDate || undefined}
                    max={dateBounds.maxDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                  />
                  <button onClick={clearFilters} className="rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em]" style={cardStyle}>
                    Clear Filters
                  </button>
                </div>
              </section>

              <div className="rounded-3xl p-10 border text-center" style={cardStyle}>
                <div className="badge-neon w-fit mx-auto mb-4">No Rows For Current Filters</div>
                <h2 className="text-3xl font-black tracking-tight mb-3">Adjust Item or Date Filters</h2>
                <p className="max-w-2xl mx-auto text-sm" style={{ color: activeTheme.muted }}>
                  Analytics can run after broadening the selected filters.
                </p>
              </div>
            </div>
          );
        }

        const demandLabels = analytics.compressed.map((item) => item.label);
        const demandValues = analytics.compressed.map((item) => item.demand);
        const revenueValues = analytics.compressed.map((item) => item.revenue);

        const weekdayLabels = analytics.weekdayPattern.map((item) => item.day);
        const weekdayValues = analytics.weekdayPattern.map((item) => item.qty);
        const forecastLabels = forecastRows.map((row) => row.date.slice(5));
        const forecastValues = forecastRows.map((row) => row.demand);
        const forecastTotal = forecastValues.reduce((sum, value) => sum + value, 0);

        return (
          <div className="space-y-6" ref={reportRef}>
            <section className="rounded-3xl border p-6" style={cardStyle}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="badge-neon w-fit">Chart Filters</div>
                <p className="text-xs font-semibold" style={{ color: activeTheme.muted }}>
                  Showing {formatNumber(filteredRows.length)} of {formatNumber(datasetRows.length)} rows
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={selectedItem}
                  onChange={(event) => setSelectedItem(event.target.value)}
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                >
                  <option value="all" style={{ color: '#111', backgroundColor: '#fff' }}>All Items</option>
                  {itemOptions.map((item) => (
                    <option key={item} value={item} style={{ color: '#111', backgroundColor: '#fff' }}>{item}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={startDate}
                  min={dateBounds.minDate || undefined}
                  max={endDate || dateBounds.maxDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || dateBounds.minDate || undefined}
                  max={dateBounds.maxDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                />
                <button
                  onClick={clearFilters}
                  disabled={!filtersActive}
                  className="rounded-xl px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-60"
                  style={cardStyle}
                >
                  Clear Filters
                </button>
              </div>
            </section>

            <section className="rounded-3xl border p-6" style={cardStyle}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="badge-neon mb-2 w-fit">Model Forecast</div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Demand Forecast </h2>
                  <p className="text-xs font-semibold mt-2" style={{ color: activeTheme.muted }}>
                    Uses filtered dataset rows and calls your configured forecast API service.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={horizonDays}
                    onChange={(event) => setHorizonDays(Number(event.target.value))}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                  >
                    {[3, 7, 14, 30].map((days) => (
                      <option key={days} value={days} style={{ color: '#111', backgroundColor: '#fff' }}>
                        {days} days
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={runForecast}
                    disabled={isForecastLoading}
                    className="rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] disabled:opacity-60"
                    style={cardStyle}
                  >
                    {isForecastLoading ? 'Running...' : 'Run Forecast'}
                  </button>
                </div>
              </div>
              {forecastError ? (
                <div className="rounded-2xl p-4 text-sm font-semibold" style={{ ...cardStyle, backgroundColor: 'rgba(255,120,120,0.12)' }}>
                  {forecastError}
                </div>
              ) : null}
              {forecastRows.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
                  <div className="rounded-2xl p-4 border xl:col-span-2" style={{ borderColor: activeTheme.border }}>
                    <BarChart
                      height={250}
                      sx={chartSx(activeTheme)}
                      xAxis={[{ scaleType: 'band', data: forecastLabels }]}
                      tooltip={{ trigger: 'item' }}
                      series={[{ data: forecastValues, label: 'Forecast Demand', color: '#00df8c' }]}
                      margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                    />
                  </div>
                  <div className="rounded-2xl p-4 border" style={{ borderColor: activeTheme.border }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: activeTheme.muted }}>Forecast Window</p>
                    <p className="text-3xl font-black mt-2">{horizonDays} days</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] mt-4" style={{ color: activeTheme.muted }}>Predicted Total</p>
                    <p className="text-2xl font-black mt-2">{formatNumber(forecastTotal)} units</p>
                    <div className="mt-4 text-xs font-semibold space-y-1" style={{ color: activeTheme.muted }}>
                      {forecastRows.slice(0, 4).map((row) => (
                        <p key={row.date}>{row.date}: {formatNumber(row.demand)}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="rounded-3xl border p-6 xl:col-span-2" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Demand and Revenue</div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Trend (Compressed for Clarity)</h2>
                <div className="rounded-2xl p-3" style={{ backgroundColor: activeTheme.soft }}>
                  <LineChart
                    height={300}
                    sx={chartSx(activeTheme)}
                    xAxis={[{ scaleType: 'point', data: demandLabels }]}
                    tooltip={{ trigger: 'axis' }}
                    series={[
                      { data: demandValues, label: 'Demand', color: '#00df8c', showMark: false, curve: 'monotoneX' },
                      {
                        data: summary.totalRevenue === null ? demandValues.map(() => null) : revenueValues,
                        label: summary.totalRevenue === null ? 'Revenue (N/A)' : 'Revenue',
                        color: '#8de7cb',
                        showMark: false,
                        curve: 'monotoneX',
                      },
                    ]}
                    grid={{ horizontal: true, vertical: false }}
                    margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border p-6" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Instability Share</div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Top Variable Items</h2>
                <PieChart
                  height={300}
                  sx={chartSx(activeTheme)}
                  series={[{ data: analytics.topInstability, innerRadius: 45, outerRadius: 95, paddingAngle: 2, cornerRadius: 4 }]}
                  tooltip={{ trigger: 'item' }}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="rounded-3xl border p-6 xl:col-span-2" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Seasonality Pattern</div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Demand by Weekday</h2>
                <div className="rounded-2xl p-3" style={{ backgroundColor: activeTheme.soft }}>
                  <BarChart
                    height={290}
                    sx={chartSx(activeTheme)}
                    xAxis={[{ scaleType: 'band', data: weekdayLabels }]}
                    tooltip={{ trigger: 'item' }}
                    series={[{ data: weekdayValues, label: 'Demand', color: '#00df8c' }]}
                    margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                  />
                </div>
              </div>

              <div className="rounded-3xl border p-6" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Summary</div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Dataset Metrics</h2>
                <div className="space-y-3">
                  <div className="rounded-2xl p-4" style={{ ...cardStyle, backgroundColor: 'rgba(0,223,140,0.08)' }}>
                    <p className="text-xs uppercase tracking-[0.18em] font-black" style={{ color: activeTheme.muted }}>Total Demand</p>
                    <p className="text-2xl font-black mt-1">{formatNumber(summary.totalDemand)}</p>
                  </div>
                  <div className="rounded-2xl p-4" style={{ ...cardStyle, backgroundColor: 'rgba(255,193,7,0.08)' }}>
                    <p className="text-xs uppercase tracking-[0.18em] font-black" style={{ color: activeTheme.muted }}>Volatility</p>
                    <p className="text-2xl font-black mt-1">{summary.volatility.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-2xl p-4" style={{ ...cardStyle, backgroundColor: 'rgba(77,220,177,0.1)' }}>
                    <p className="text-xs uppercase tracking-[0.18em] font-black" style={{ color: activeTheme.muted }}>Revenue</p>
                    <p className="text-2xl font-black mt-1">{summary.totalRevenue === null ? 'N/A' : formatCurrency(summary.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border p-6" style={cardStyle}>
              <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                <div>
                  <div className="badge-neon mb-2 w-fit">AI Suggestions</div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Generated From Dataset Signals</h2>
                </div>
                <button
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-60"
                  style={cardStyle}
                >
                  {isExportingPdf ? 'Exporting PDF...' : 'Export PDF Report'}
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {analytics.recommendations.map((item) => (
                  <div key={`${item.pillar}-${item.action}`} className="rounded-2xl p-4 border" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.soft }}>
                    <p className="text-xs uppercase tracking-[0.16em] font-black" style={{ color: activeTheme.muted }}>{item.pillar}</p>
                    <p className="text-sm font-bold mt-2">{item.action}</p>
                    <p className="text-xs font-semibold mt-2" style={{ color: '#00b26b' }}>{item.impact}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border p-6" style={cardStyle}>
              <div className="badge-neon mb-2 w-fit">NLP Copilot</div>
              <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Ask About This Dataset</h2>

              <div className="rounded-2xl p-4 h-72 overflow-y-auto space-y-3" style={{ backgroundColor: activeTheme.soft }}>
                {chatMessages.map((msg, index) => (
                  <div
                    key={`${msg.role}_${index}`}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-medium ${msg.role === 'user' ? 'ml-auto' : ''}`}
                    style={{ backgroundColor: msg.role === 'user' ? 'rgba(0,223,140,0.16)' : 'rgba(255,255,255,0.08)' }}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Try: hi, demand trend, top unstable item, revenue guidance"
                  className="w-full rounded-2xl px-4 py-3 text-sm"
                  style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                />
                <button onClick={handleSendMessage} className="px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.16em]" style={cardStyle}>Send</button>
              </div>
            </section>
          </div>
        );
      }}
    </AuthenticatedSectionLayout>
  );
}
