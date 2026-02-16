import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import AuthenticatedSectionLayout from '../components/AuthenticatedSectionLayout';
import { getCurrentUser } from '../auth/auth';
import { DATASET_EVENT, loadDatasetForUser, summarizeDataset } from '../utils/datasetStore';

const FORECAST_API_BASE = (import.meta.env.VITE_FORECAST_API_URL || '').trim().replace(/\/$/, '');
const FORECAST_API_KEY = (import.meta.env.VITE_FORECAST_API_KEY || '').trim();

function chartSx(theme) {
  return {
    '& .MuiChartsAxis-root .MuiChartsAxis-line': { stroke: theme.border },
    '& .MuiChartsAxis-root .MuiChartsAxis-tick': { stroke: theme.border },
    '& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-label': { fill: theme.text, fontSize: 11 },
    '& .MuiChartsGrid-line': { stroke: theme.border },
    '& .MuiChartsLegend-root, & .MuiChartsLegend-root *': {
      color: `${theme.text} !important`,
      fill: `${theme.text} !important`,
    },
    '& .MuiChartsTooltip-root, & .MuiChartsTooltip-root *': {
      color: `${theme.text} !important`,
      fill: `${theme.text} !important`,
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

function compressSeries(series, maxPoints = 24) {
  if (series.length <= maxPoints) {
    return series.map((item) => ({ label: item.date.slice(5), demand: item.demand }));
  }

  const bucketSize = Math.ceil(series.length / maxPoints);
  const output = [];

  for (let i = 0; i < series.length; i += bucketSize) {
    const bucket = series.slice(i, i + bucketSize);
    const avgDemand = bucket.reduce((sum, item) => sum + item.demand, 0) / bucket.length;
    const label = bucket[bucket.length - 1].date.slice(5);
    output.push({ label, demand: Math.round(avgDemand) });
  }

  return output;
}

function compressValues(values, labels, maxPoints = 24) {
  if (values.length <= maxPoints) {
    return { values, labels };
  }

  const bucketSize = Math.ceil(values.length / maxPoints);
  const resultValues = [];
  const resultLabels = [];

  for (let i = 0; i < values.length; i += bucketSize) {
    const bucketValues = values.slice(i, i + bucketSize);
    const bucketLabels = labels.slice(i, i + bucketSize);
    const avg = bucketValues.reduce((sum, val) => sum + val, 0) / bucketValues.length;
    resultValues.push(Math.round(avg));
    resultLabels.push(bucketLabels[bucketLabels.length - 1]);
  }

  return { values: resultValues, labels: resultLabels };
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

export default function HomeDashboardPage() {
  const user = getCurrentUser();
  const userId = user?.email || '';
  const [dataset, setDataset] = useState(() => loadDatasetForUser(userId));
  const [selectedItem, setSelectedItem] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    const headers = {
      'Content-Type': 'application/json',
    };
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
            // Keep status message.
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

  return (
    <AuthenticatedSectionLayout
      title="Dashboard"
      subtitle="Dataset-driven cockpit. Import data first to generate KPIs and visuals from your own records."
    >
      {({ activeTheme, cardStyle }) => {
        if (!hasDataset) {
          return (
            <div className="rounded-3xl p-10 border text-center" style={cardStyle}>
              <div className="badge-neon w-fit mx-auto mb-4">No Dataset Imported</div>
              <h2 className="text-3xl font-black tracking-tight mb-3">Upload Data To Generate Dashboard</h2>
              <p className="max-w-2xl mx-auto text-sm" style={{ color: activeTheme.muted }}>
                Dashboard metrics are disabled until dataset import is complete.
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

        if (!summary) {
          return (
            <div className="space-y-6">
              <section className="rounded-3xl p-6 border" style={cardStyle}>
                <div className="badge-neon mb-3 w-fit">Chart Filters</div>
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
                <p className="text-xs font-semibold mt-3" style={{ color: activeTheme.muted }}>
                  Showing 0 of {formatNumber(datasetRows.length)} rows.
                </p>
              </section>

              <div className="rounded-3xl p-10 border text-center" style={cardStyle}>
                <div className="badge-neon w-fit mx-auto mb-4">No Rows For Current Filters</div>
                <h2 className="text-3xl font-black tracking-tight mb-3">Adjust Item or Date Filters</h2>
                <p className="max-w-2xl mx-auto text-sm" style={{ color: activeTheme.muted }}>
                  Your dataset is available, but the selected filters returned no records.
                </p>
              </div>
            </div>
          );
        }

        const kpis = [
          { label: 'Total Demand', value: formatNumber(summary.totalDemand), unit: 'units', delta: `${formatNumber(summary.totalRows)} rows` },
          { label: 'Data Days', value: formatNumber(summary.dataDays), unit: 'days', delta: 'timeline covered' },
          { label: 'Avg Daily Demand', value: formatNumber(summary.avgDailyDemand), unit: 'units/day', delta: 'historical mean' },
          {
            label: 'Total Revenue',
            value: summary.totalRevenue === null ? 'N/A' : formatCurrency(summary.totalRevenue),
            unit: '',
            delta: summary.totalRevenue === null ? 'missing revenue column' : 'from dataset',
          },
          { label: 'Demand Volatility', value: `${summary.volatility.toFixed(1)}`, unit: '%', delta: 'std dev / mean' },
        ];

        const compressedDemand = compressSeries(summary.dailySeries, 24);
        const demandLabels = compressedDemand.map((item) => item.label);
        const demandValues = compressedDemand.map((item) => item.demand);

        const topItemPie = summary.topItems.slice(0, 5).map((item, index) => ({
          id: index,
          value: item.qty,
          label: item.itemName,
          color: ['#00df8c', '#56e7b7', '#9ef5d8', '#43b58f', '#22795e'][index],
        }));

        const dayChangeLabelsRaw = summary.dailySeries.map((point) => point.date.slice(5));
        const compactChange = compressValues(summary.dayToDayChange, dayChangeLabelsRaw, 24);
        const forecastLabels = forecastRows.map((row) => row.date.slice(5));
        const forecastValues = forecastRows.map((row) => row.demand);
        const forecastTotal = forecastValues.reduce((sum, value) => sum + value, 0);

        const alerts = [];
        if (summary.volatility > 35) alerts.push('High demand volatility detected. Use conservative prep buffers.');
        if (summary.totalRevenue === null) alerts.push('Revenue column missing. Revenue analytics are limited.');
        if (!alerts.length) alerts.push('Data profile is stable. Trend confidence is moderate to high.');

        return (
          <div className="space-y-6">
            <section className="rounded-3xl p-6 border" style={cardStyle}>
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

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-3xl p-5 border" style={cardStyle}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: activeTheme.muted }}>{kpi.label}</p>
                  <p className="text-2xl font-black mt-2 leading-tight">
                    {kpi.value}
                    {kpi.unit ? <span className="text-xs ml-1" style={{ color: activeTheme.muted }}>{kpi.unit}</span> : null}
                  </p>
                  <p className="text-xs font-semibold mt-2" style={{ color: activeTheme.muted }}>{kpi.delta}</p>
                </div>
              ))}
            </section>

            <section className="rounded-3xl p-6 border" style={cardStyle}>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="badge-neon mb-2 w-fit">Model Forecast</div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Demand Forecast API</h2>
                  <p className="text-xs font-semibold mt-2" style={{ color: activeTheme.muted }}>
                    Uses filtered dataset rows and calls {FORECAST_API_BASE || 'VITE_FORECAST_API_URL not configured'}.
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
              <div className="rounded-3xl p-6 xl:col-span-2 border" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Demand Trend</div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Demand by Day (Compressed)</h2>
                <div className="rounded-2xl p-3" style={{ backgroundColor: activeTheme.soft }}>
                  <LineChart
                    height={280}
                    sx={chartSx(activeTheme)}
                    xAxis={[{ scaleType: 'point', data: demandLabels }]}
                    tooltip={{ trigger: 'axis' }}
                    series={[{ data: demandValues, label: 'Demand', color: '#00df8c', showMark: false, curve: 'monotoneX' }]}
                    grid={{ horizontal: true, vertical: false }}
                    margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                  />
                </div>
              </div>

              <div className="rounded-3xl p-6 border" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Item Mix</div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Top Items Share</h2>
                <PieChart
                  height={270}
                  sx={chartSx(activeTheme)}
                  series={[{ innerRadius: 52, outerRadius: 96, data: topItemPie, paddingAngle: 2, cornerRadius: 4 }]}
                  tooltip={{ trigger: 'item' }}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="rounded-3xl p-6 border xl:col-span-2" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Preparation Baseline</div>
                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Suggested Prep (Historical Average)</h2>
                <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: activeTheme.border }}>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.18em]" style={{ color: activeTheme.muted }}>
                        <th className="px-4 py-3 font-black">Item</th>
                        <th className="px-4 py-3 font-black">Historical Total</th>
                        <th className="px-4 py-3 font-black">Suggested Prep</th>
                        <th className="px-4 py-3 font-black">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.prepRecommendations.map((row) => (
                        <tr key={row.item} className="border-t" style={{ borderColor: activeTheme.border }}>
                          <td className="px-4 py-3 font-semibold">{row.item}</td>
                          <td className="px-4 py-3">{formatNumber(row.historicalTotal)}</td>
                          <td className="px-4 py-3">{formatNumber(row.suggestedPrep)}</td>
                          <td className="px-4 py-3">{row.confidence}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl p-6 border" style={cardStyle}>
                <div className="badge-neon mb-2 w-fit">Alerts</div>
                <h2 className="text-xl font-black uppercase tracking-tight mb-4">Data Signals</h2>
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert} className="rounded-2xl p-4" style={{ ...cardStyle, backgroundColor: 'rgba(255,193,7,0.1)' }}>
                      <p className="text-sm font-semibold">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-3xl p-6 border" style={cardStyle}>
              <div className="badge-neon mb-2 w-fit">Variability</div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-4">Day-To-Day Demand Change (Compressed)</h2>
              <div className="rounded-2xl p-3" style={{ backgroundColor: activeTheme.soft }}>
                <BarChart
                  height={240}
                  sx={chartSx(activeTheme)}
                  xAxis={[{ scaleType: 'band', data: compactChange.labels }]}
                  tooltip={{ trigger: 'item' }}
                  series={[{ data: compactChange.values, label: 'Absolute Change', color: '#4adcb1' }]}
                  margin={{ left: 40, right: 20, top: 20, bottom: 30 }}
                />
              </div>
            </section>
          </div>
        );
      }}
    </AuthenticatedSectionLayout>
  );
}
