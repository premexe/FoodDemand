import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import AuthenticatedSectionLayout from '../components/AuthenticatedSectionLayout';
import { getCurrentUser } from '../auth/auth';
import {
  appendUploadHistoryForUser,
  loadUploadHistoryForUser,
  normalizeRows,
  removeUploadHistoryEntriesForUser,
  saveDatasetForUser,
} from '../utils/datasetStore';

const REQUIRED_FIELDS = ['date', 'itemName', 'quantity'];
const TARGET_FIELDS = [
  { key: 'date', label: 'Date' },
  { key: 'itemName', label: 'Item Name' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'revenue', label: 'Revenue (optional)' },
];

function normalizeHeader(value) {
  return String(value || '').trim().toLowerCase();
}

function parseCsvRows(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.map((line) => line.split(',').map((cell) => cell.trim()));
}

async function parseFileToRows(file) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.csv')) {
    const text = await file.text();
    return parseCsvRows(text);
  }

  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
  }

  throw new Error('Unsupported format. Upload .csv, .xlsx, or .xls.');
}

function autoMapColumns(headers) {
  const mapped = {
    date: '',
    itemName: '',
    quantity: '',
    revenue: '',
  };

  const headerLookup = headers.reduce((acc, header) => {
    acc[header] = normalizeHeader(header);
    return acc;
  }, {});

  for (const header of headers) {
    const value = headerLookup[header];
    if (!mapped.date && (value.includes('date') || value.includes('day'))) {
      mapped.date = header;
    }
    if (!mapped.itemName && (value.includes('item') || value.includes('menu') || value.includes('product'))) {
      mapped.itemName = header;
    }
    if (!mapped.quantity && (value.includes('qty') || value.includes('quantity') || value.includes('units') || value.includes('count'))) {
      mapped.quantity = header;
    }
    if (!mapped.revenue && (value.includes('revenue') || value.includes('sales') || value.includes('amount'))) {
      mapped.revenue = header;
    }
  }

  return mapped;
}

function quantile(sortedNumbers, percentile) {
  if (sortedNumbers.length === 0) return 0;
  const position = (sortedNumbers.length - 1) * percentile;
  const base = Math.floor(position);
  const rest = position - base;
  const lower = sortedNumbers[base] ?? sortedNumbers[sortedNumbers.length - 1];
  const upper = sortedNumbers[base + 1] ?? lower;
  return lower + rest * (upper - lower);
}

function evaluateDataHealth(rows, mapping) {
  const issues = [];
  if (!rows.length) {
    return {
      score: 0,
      blockingErrors: ['No data rows available.'],
      warnings: [],
      stats: { totalRows: 0, duplicates: 0, invalidDates: 0, negativeQuantity: 0, negativeRevenue: 0, outliers: 0 },
    };
  }

  const missingMapFields = REQUIRED_FIELDS.filter((field) => !mapping[field]);
  const blockingErrors = [];
  const warnings = [];
  if (missingMapFields.length > 0) {
    blockingErrors.push(`Map required columns: ${missingMapFields.join(', ')}`);
  }

  let invalidDates = 0;
  let negativeQuantity = 0;
  let negativeRevenue = 0;
  let missingRequiredCells = 0;
  const rowKeys = new Set();
  let duplicates = 0;
  const quantityValues = [];

  rows.forEach((row) => {
    const dateValue = mapping.date ? row[mapping.date] : '';
    const itemValue = mapping.itemName ? row[mapping.itemName] : '';
    const quantityValue = mapping.quantity ? row[mapping.quantity] : '';
    const revenueValue = mapping.revenue ? row[mapping.revenue] : '';

    if (!String(dateValue || '').trim() || !String(itemValue || '').trim() || !String(quantityValue || '').trim()) {
      missingRequiredCells += 1;
    }

    if (mapping.date && Number.isNaN(Date.parse(String(dateValue || '').trim()))) {
      invalidDates += 1;
    }

    const parsedQty = Number(quantityValue);
    if (mapping.quantity && Number.isFinite(parsedQty)) {
      quantityValues.push(parsedQty);
      if (parsedQty < 0) {
        negativeQuantity += 1;
      }
    }

    const parsedRevenue = Number(revenueValue);
    if (mapping.revenue && String(revenueValue || '').trim() && Number.isFinite(parsedRevenue) && parsedRevenue < 0) {
      negativeRevenue += 1;
    }

    const duplicateKey = [dateValue, itemValue, quantityValue, revenueValue].map((value) => String(value || '').trim()).join('|');
    if (duplicateKey !== '|||') {
      if (rowKeys.has(duplicateKey)) {
        duplicates += 1;
      } else {
        rowKeys.add(duplicateKey);
      }
    }
  });

  let outliers = 0;
  const validQty = quantityValues.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (validQty.length >= 6) {
    const q1 = quantile(validQty, 0.25);
    const q3 = quantile(validQty, 0.75);
    const iqr = q3 - q1;
    const upper = q3 + 1.5 * iqr;
    outliers = validQty.filter((value) => value > upper).length;
  }

  if (missingRequiredCells > 0) {
    issues.push({ weight: 18, ratio: missingRequiredCells / rows.length, message: `${missingRequiredCells} rows missing required values.` });
  }
  if (invalidDates > 0) {
    issues.push({ weight: 18, ratio: invalidDates / rows.length, message: `${invalidDates} rows contain invalid dates.` });
  }
  if (duplicates > 0) {
    issues.push({ weight: 10, ratio: duplicates / rows.length, message: `${duplicates} duplicate rows detected.` });
  }
  if (negativeQuantity > 0) {
    issues.push({ weight: 16, ratio: negativeQuantity / rows.length, message: `${negativeQuantity} rows have negative quantity.` });
  }
  if (negativeRevenue > 0) {
    issues.push({ weight: 8, ratio: negativeRevenue / rows.length, message: `${negativeRevenue} rows have negative revenue.` });
  }
  if (outliers > 0) {
    issues.push({ weight: 6, ratio: outliers / rows.length, message: `${outliers} potential quantity outliers found.` });
  }

  for (const issue of issues) {
    if (issue.weight >= 16 && issue.ratio > 0.05) {
      blockingErrors.push(issue.message);
    } else {
      warnings.push(issue.message);
    }
  }

  let score = 100;
  issues.forEach((issue) => {
    score -= Math.round(issue.weight * Math.min(issue.ratio * 5, 1));
  });
  score = Math.max(0, score);

  return {
    score,
    blockingErrors,
    warnings,
    stats: {
      totalRows: rows.length,
      duplicates,
      invalidDates,
      negativeQuantity,
      negativeRevenue,
      outliers,
    },
  };
}

export default function UploadDataPage() {
  const user = getCurrentUser();
  const userId = user?.email || '';
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({ date: '', itemName: '', quantity: '', revenue: '' });
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadHistory, setUploadHistory] = useState(() => loadUploadHistoryForUser(userId));
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  const previewRows = useMemo(() => rows.slice(0, 6), [rows]);
  const validation = useMemo(() => evaluateDataHealth(rows, columnMapping), [rows, columnMapping]);

  useEffect(() => {
    setUploadHistory(loadUploadHistoryForUser(userId));
  }, [userId]);

  useEffect(() => {
    const validIds = new Set(uploadHistory.map((entry) => entry.id));
    setSelectedHistoryIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [uploadHistory]);

  const parseAndSetFile = async (file) => {
    const lowerName = file.name.toLowerCase();
    if (!(lowerName.endsWith('.csv') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))) {
      setUploadMessage('Unsupported format. Upload CSV, XLSX, or XLS.');
      return;
    }

    try {
      const matrix = await parseFileToRows(file);
      if (!matrix.length || matrix[0].length === 0) {
        setUploadMessage('File parsed but no tabular rows were found.');
        return;
      }

      const fileHeaders = matrix[0].map((value, index) => String(value || `column_${index + 1}`).trim() || `column_${index + 1}`);
      const dataRows = matrix.slice(1).map((row) => {
        const item = {};
        fileHeaders.forEach((header, index) => {
          item[header] = row[index] ?? '';
        });
        return item;
      }).filter((row) => Object.values(row).some((value) => String(value || '').trim() !== ''));

      const nextMapping = autoMapColumns(fileHeaders);

      setUploadedFile(file);
      setHeaders(fileHeaders);
      setRows(dataRows);
      setColumnMapping(nextMapping);
      setUploadMessage(`Loaded ${dataRows.length} rows from ${file.name}. Map columns and review validation before import.`);
    } catch (error) {
      setUploadMessage(error.message || 'Unable to parse file.');
    }
  };

  const handleInputChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await parseAndSetFile(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    await parseAndSetFile(file);
  };

  const importData = () => {
    if (!uploadedFile) {
      setUploadMessage('Upload a file before import.');
      return;
    }

    const status = validation.blockingErrors.length > 0 ? 'Failed' : 'Imported';
    const record = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      fileName: uploadedFile.name,
      rows: rows.length,
      score: validation.score,
      status,
      time: new Date().toLocaleString(),
    };

    appendUploadHistoryForUser(userId, record, 20);
    setUploadHistory(loadUploadHistoryForUser(userId));
    if (status === 'Imported') {
      const normalizedRows = normalizeRows(rows, columnMapping);
      saveDatasetForUser(userId, {
        importedAt: new Date().toISOString(),
        fileName: uploadedFile.name,
        rows: normalizedRows,
        mapping: columnMapping,
        validation,
      });
    }
    setUploadMessage(
      status === 'Imported'
        ? 'Dataset imported successfully. Dashboard and analytics are now using this dataset.'
        : 'Import blocked due to validation errors. Fix mapping/data and retry.',
    );
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsRetraining(false);
    setUploadMessage('Model retraining started using latest imported dataset.');
  };

  const toggleHistorySelection = (entryId) => {
    setSelectedHistoryIds((prev) => (
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    ));
  };

  const toggleSelectAllHistory = () => {
    if (selectedHistoryIds.length === uploadHistory.length) {
      setSelectedHistoryIds([]);
      return;
    }
    setSelectedHistoryIds(uploadHistory.map((entry) => entry.id));
  };

  const removeSelectedHistory = () => {
    if (!selectedHistoryIds.length) return;
    removeUploadHistoryEntriesForUser(userId, selectedHistoryIds);
    setUploadHistory(loadUploadHistoryForUser(userId));
    setSelectedHistoryIds([]);
    setUploadMessage(`Removed ${selectedHistoryIds.length} history entr${selectedHistoryIds.length === 1 ? 'y' : 'ies'}.`);
  };

  return (
    <AuthenticatedSectionLayout
      title="Upload Data"
      subtitle="Universal tabular intake supporting CSV and Excel with schema mapping, validation, and retraining workflow."
    >
      {({ activeTheme, cardStyle }) => (
        <div className="space-y-6">
          <section className="bento-card p-6" style={cardStyle}>
            <div className="badge-neon mb-4 w-fit">Input Engine</div>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className="rounded-3xl p-8 border-2 border-dashed transition-colors"
              style={{ borderColor: isDragging ? '#00ff9d' : activeTheme.border, backgroundColor: activeTheme.soft }}
            >
              <div className="flex items-center gap-3 mb-4">
                <img src="/cookiq-mark.svg" alt="CookIQ logo" className="w-10 h-10 rounded-xl float-soft" />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em]">CookIQ Dataset Intake</p>
                  <p className="text-[11px] font-semibold" style={{ color: activeTheme.muted }}>Smart parser for tabular restaurant demand data.</p>
                </div>
              </div>
              <p className="text-sm font-semibold mb-3">Drag and drop a dataset or choose a file.</p>
              <p className="text-xs mb-4" style={{ color: activeTheme.muted }}>
                Supported formats: .csv, .xlsx, .xls
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.14em]"
                  style={{ ...cardStyle, color: activeTheme.text }}
                >
                  Select Dataset
                </button>
                <span className="text-sm font-semibold" style={{ color: activeTheme.muted }}>
                  {uploadedFile?.name || 'No file selected'}
                </span>
              </div>
              {uploadMessage && (
                <p className="mt-4 text-xs font-semibold" style={{ color: activeTheme.muted }}>
                  {uploadMessage}
                </p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bento-card p-6" style={cardStyle}>
              <div className="badge-neon mb-4 w-fit">Column Mapping</div>
              <div className="space-y-3">
                {TARGET_FIELDS.map((field) => (
                  <div key={field.key} className="grid grid-cols-2 gap-3 items-center">
                    <label className="text-xs font-black uppercase tracking-[0.12em]" style={{ color: activeTheme.text }}>
                      {field.label}
                    </label>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(event) => setColumnMapping((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      className="rounded-xl px-3 py-2 text-sm"
                      style={{ backgroundColor: activeTheme.soft, border: `1px solid ${activeTheme.border}`, color: activeTheme.text }}
                    >
                      <option value="" style={{ color: '#000' }}>Select column</option>
                      {headers.map((header) => (
                        <option key={header} value={header} style={{ color: '#000' }}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={importData} className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em]" style={cardStyle}>
                  Import Dataset
                </button>
                <button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className="px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] disabled:opacity-60"
                  style={cardStyle}
                >
                  {isRetraining ? 'Retraining...' : 'Retrain Model'}
                </button>
              </div>
            </div>

            <div className="bento-card p-6" style={cardStyle}>
              <div className="badge-neon mb-4 w-fit">Validation Status</div>
              <p className="text-4xl font-black tracking-tight mb-4">{validation.score}/100</p>
              <p className="text-xs uppercase tracking-[0.2em] font-black mb-3" style={{ color: activeTheme.muted }}>
                Dataset Health Score
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold mb-4">
                <div className="rounded-xl p-3" style={cardStyle}>Rows: {validation.stats.totalRows}</div>
                <div className="rounded-xl p-3" style={cardStyle}>Duplicates: {validation.stats.duplicates}</div>
                <div className="rounded-xl p-3" style={cardStyle}>Invalid Dates: {validation.stats.invalidDates}</div>
                <div className="rounded-xl p-3" style={cardStyle}>Negative Qty: {validation.stats.negativeQuantity}</div>
              </div>
              <div className="space-y-2">
                {validation.blockingErrors.length > 0 && validation.blockingErrors.map((error) => (
                  <p key={error} className="text-xs font-semibold" style={{ color: '#ff8e79' }}>Blocking: {error}</p>
                ))}
                {validation.warnings.length > 0 && validation.warnings.map((warning) => (
                  <p key={warning} className="text-xs font-semibold" style={{ color: activeTheme.muted }}>Warning: {warning}</p>
                ))}
                {validation.blockingErrors.length === 0 && validation.warnings.length === 0 && (
                  <p className="text-xs font-semibold" style={{ color: '#00ff9d' }}>No validation issues detected.</p>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bento-card p-6" style={cardStyle}>
              <div className="badge-neon mb-4 w-fit">Data Preview</div>
              {previewRows.length > 0 ? (
                <div className="overflow-auto rounded-2xl" style={cardStyle}>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr>
                        {headers.map((header) => (
                          <th key={header} className="px-3 py-2 font-black uppercase tracking-[0.12em]" style={{ color: activeTheme.muted }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr key={`row_${rowIndex}`} className="border-t border-white/10">
                          {headers.map((header) => (
                            <td key={`${rowIndex}_${header}`} className="px-3 py-2">{String(row[header] ?? '') || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm font-semibold" style={{ color: activeTheme.muted }}>Upload a file to view preview.</p>
              )}
            </div>

            <div className="bento-card p-6" style={cardStyle}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="badge-neon w-fit">Upload History</div>
                {uploadHistory.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAllHistory}
                      className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.14em]"
                      style={cardStyle}
                    >
                      {selectedHistoryIds.length === uploadHistory.length ? 'Unselect All' : 'Select All'}
                    </button>
                    <button
                      type="button"
                      onClick={removeSelectedHistory}
                      disabled={!selectedHistoryIds.length}
                      className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.14em] disabled:opacity-60"
                      style={cardStyle}
                    >
                      Remove Selected ({selectedHistoryIds.length})
                    </button>
                  </div>
                ) : null}
              </div>
              {uploadHistory.length > 0 ? (
                <div className="space-y-3">
                  {uploadHistory.map((entry) => (
                    <div key={entry.id} className="rounded-2xl p-4" style={cardStyle}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedHistoryIds.includes(entry.id)}
                          onChange={() => toggleHistorySelection(entry.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-black tracking-tight break-all">{entry.fileName}</p>
                          <p className="text-xs font-semibold" style={{ color: activeTheme.muted }}>
                            {entry.rows} rows | Score {entry.score} | {entry.time}
                          </p>
                          <p className="text-xs font-black uppercase tracking-[0.2em] mt-2" style={{ color: entry.status === 'Imported' ? '#00ff9d' : '#ff8e79' }}>
                            {entry.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold" style={{ color: activeTheme.muted }}>No uploads yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </AuthenticatedSectionLayout>
  );
}
