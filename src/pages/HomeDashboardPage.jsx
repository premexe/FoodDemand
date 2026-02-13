import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import AuthenticatedSectionLayout from '../components/AuthenticatedSectionLayout';
import { getCurrentUser } from '../auth/auth';
import { DATASET_EVENT, loadDatasetForUser, summarizeDataset } from '../utils/datasetStore';

function chartSx(theme) {
  return {
    '& .MuiChartsAxis-root .MuiChartsAxis-line': { stroke: theme.border },
    '& .MuiChartsAxis-root .MuiChartsAxis-tick': { stroke: theme.border },
    '& .MuiChartsAxis-tickLabel, & .MuiChartsLegend-label': { fill: theme.text, fontSize: 11 },
    '& .MuiChartsGrid-line': { stroke: theme.border },
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

export default function HomeDashboardPage() {
  const user = getCurrentUser();
  const userId = user?.email || '';
  const [dataset, setDataset] = useState(() => loadDatasetForUser(userId));

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

  const summary = useMemo(() => summarizeDataset(dataset), [dataset]);

  return (
    <AuthenticatedSectionLayout
      title="Dashboard"
      subtitle="Dataset-driven cockpit. Import data first to generate KPIs and visuals from your own records."
    >
      {({ activeTheme, cardStyle }) => {
        if (!summary) {
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

        const alerts = [];
        if (summary.volatility > 35) alerts.push('High demand volatility detected. Use conservative prep buffers.');
        if (summary.totalRevenue === null) alerts.push('Revenue column missing. Revenue analytics are limited.');
        if (!alerts.length) alerts.push('Data profile is stable. Trend confidence is moderate to high.');

        return (
          <div className="space-y-6">
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
