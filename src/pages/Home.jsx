import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../auth/auth';
import ThemeModeButton from '../components/ThemeModeButton';

const THEME_KEY = 'fooddemand.home.theme';
const THEME_EVENT = 'fd-theme-change';

const links = [
  { id: 'upload-data', label: 'Upload Data' },
  { id: 'dashboard-section', label: 'Dashboard' },
  { id: 'suggestions-section', label: 'Suggestions' },
  { id: 'profile', label: 'Profile' },
];

const themes = {
  dark: {
    bg: '#050607',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.6)',
    soft: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.09)',
    header: 'rgba(5,6,7,0.8)',
  },
  light: {
    bg: '#f7faf7',
    text: '#101513',
    muted: 'rgba(16,21,19,0.65)',
    soft: 'rgba(16,21,19,0.05)',
    border: 'rgba(16,21,19,0.12)',
    header: 'rgba(247,250,247,0.88)',
  },
};

export default function Home() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [scrolled, setScrolled] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewRows, setPreviewRows] = useState([]);

  const resolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return themeMode;
  }, [systemDark, themeMode]);

  const activeTheme = themes[resolvedTheme];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const onThemeChange = (event) => {
      const mode = event.detail?.mode;
      if (mode === 'dark' || mode === 'light' || mode === 'system') {
        setThemeMode(mode);
      }
    };
    window.addEventListener(THEME_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_EVENT, onThemeChange);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event) => setSystemDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const cardStyle = {
    backgroundColor: activeTheme.soft,
    border: `1px solid ${activeTheme.border}`,
  };

  const verificationLabel = user?.verificationMethod
    ? user.verificationMethod.charAt(0).toUpperCase() + user.verificationMethod.slice(1)
    : 'Unknown';

  const profileItems = [
    { label: 'Full Name', value: user?.name || 'Not available' },
    { label: 'Email', value: user?.email || 'Not available' },
    { label: 'Phone', value: user?.phoneNumber || 'Not available' },
    { label: 'Verification', value: verificationLabel },
    { label: 'Theme', value: resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1) },
  ];

  const handleDatasetUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    if (!isCsv) {
      setUploadStatus('Please upload a CSV file only.');
      setUploadedFileName('');
      setPreviewRows([]);
      return;
    }

    setUploadedFileName(file.name);

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        setUploadStatus('CSV uploaded, but no data rows found.');
        setPreviewRows([]);
        return;
      }

      const rows = lines.slice(0, 6).map((line) => line.split(',').map((cell) => cell.trim()));
      setPreviewRows(rows);
      setUploadStatus(`Dataset uploaded successfully. Showing first ${Math.max(rows.length - 1, 0)} rows.`);
    } catch {
      setUploadStatus('Unable to read this CSV file. Try another file.');
      setPreviewRows([]);
    }
  };

  return (
    <div
      style={{ backgroundColor: activeTheme.bg, color: activeTheme.text }}
      className="min-h-screen font-['Inter'] selection:bg-[#00ff9d] selection:text-black"
    >
      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-500 px-6 md:px-10 py-5">
        <nav
          className="mx-auto max-w-7xl rounded-full backdrop-blur-xl px-6 md:px-8"
          style={{
            backgroundColor: scrolled ? activeTheme.header : 'transparent',
            border: `1px solid ${scrolled ? activeTheme.border : 'transparent'}`,
          }}
        >
          <div className="h-14 flex items-center justify-between gap-4">
            <div className="text-xl font-black tracking-tight uppercase">
              CookIQ<span className="text-[#00ff9d]">.</span>ai
            </div>

            <div className="hidden lg:flex items-center gap-9">
              {links.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-[11px] font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-100"
                  style={{ opacity: 0.75 }}
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ThemeModeButton />
            </div>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-10 pt-40 pb-20">
          <div className="badge-neon mb-8 w-fit">Logged In Home</div>
          <h1 className="text-[64px] md:text-[100px] font-black tracking-tighter leading-[0.92] mb-8 text-reveal">
            Master the<br />
            Art of<br />
            Precision<span className="text-[#00ff9d]">.</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl" style={{ color: activeTheme.muted }}>
            Welcome back{user?.name ? `, ${user.name}` : ''}. This workspace is focused on intelligent food demand forecasting and waste optimization.
          </p>
        </section>

        <section id="upload-data" className="container mx-auto px-10 py-14">
          <div className="bento-card p-10 md:p-12" style={cardStyle}>
            <div className="badge-neon mb-6 w-fit">Upload Data</div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-5">Upload Dataset (CSV)</h2>
            <p className="text-base md:text-lg mb-8 max-w-3xl" style={{ color: activeTheme.muted }}>
              Upload your daily sales CSV so CookIQ.ai can start demand forecasting and waste optimization from real historical patterns.
            </p>

            <div className="rounded-3xl p-6 md:p-8 mb-6" style={cardStyle}>
              <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-4" style={{ color: activeTheme.muted }}>
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleDatasetUpload}
                className="block w-full text-sm"
              />
              {uploadedFileName && (
                <p className="mt-4 text-sm font-semibold">
                  File: <span style={{ color: activeTheme.muted }}>{uploadedFileName}</span>
                </p>
              )}
              {uploadStatus && (
                <p className="mt-3 text-sm font-semibold" style={{ color: activeTheme.muted }}>
                  {uploadStatus}
                </p>
              )}
            </div>

            {previewRows.length > 0 && (
              <div className="overflow-x-auto rounded-3xl" style={cardStyle}>
                <table className="w-full text-left text-sm">
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={`${rowIndex}-${row.join('-')}`} className={rowIndex === 0 ? 'font-black uppercase text-[11px]' : ''}>
                        {row.map((cell, cellIndex) => (
                          <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 border-b border-white/10">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section id="dashboard-section" className="container mx-auto px-10 py-12">
          <div className="bento-card p-10" style={cardStyle}>
            <div className="badge-neon mb-4 w-fit">Dashboard</div>
            <h3 className="text-3xl font-black uppercase tracking-tight mb-3">Dashboard Section</h3>
            <p style={{ color: activeTheme.muted }}>
              Placeholder section added. We can build this block next with your required dashboard widgets.
            </p>
          </div>
        </section>

        <section id="suggestions-section" className="container mx-auto px-10 py-12">
          <div className="bento-card p-10" style={cardStyle}>
            <div className="badge-neon mb-4 w-fit">Suggestions</div>
            <h3 className="text-3xl font-black uppercase tracking-tight mb-3">Suggestions Section</h3>
            <p style={{ color: activeTheme.muted }}>
              Placeholder section added. We can implement AI suggestions logic here when you say.
            </p>
          </div>
        </section>

        <section id="profile" className="container mx-auto px-10 py-16 pb-24">
          <div className="bento-card p-10" style={cardStyle}>
            <div className="badge-neon mb-4 w-fit">Profile</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {profileItems.map((item) => (
                <div key={item.label} className="rounded-2xl px-5 py-4" style={cardStyle}>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2" style={{ color: activeTheme.muted }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold break-all">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  logout();
                  navigate('/', { replace: true });
                }}
                className="px-7 py-3 rounded-full text-sm font-black uppercase tracking-widest"
                style={cardStyle}
              >
                Logout
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
