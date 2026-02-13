import { useEffect, useMemo, useState } from 'react';
import LoginModal from '../components/LoginModal';
import ThemeModeButton from '../components/ThemeModeButton';

const THEME_KEY = 'fooddemand.home.theme';
const THEME_EVENT = 'fd-theme-change';

const themes = {
  dark: {
    bg: '#060809',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.72)',
    card: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255,255,255,0.14)',
    heroGlow: 'rgba(0,223,140,0.16)',
  },
  light: {
    bg: '#f6fbf8',
    text: '#000000',
    muted: 'rgba(0,0,0,0.72)',
    card: 'rgba(0,0,0,0.05)',
    border: 'rgba(0,0,0,0.14)',
    heroGlow: 'rgba(0,160,98,0.15)',
  },
};

function resolveTheme(mode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode === 'light' ? 'light' : 'dark';
}

const featureCards = [
  { title: 'Forecast Core', text: 'Demand projection by item and service slot.' },
  { title: 'Waste Shield', text: 'Batch and stock guidance to prevent overproduction.' },
  { title: 'Revenue Lens', text: 'See margin impact of prep and pricing decisions.' },
  { title: 'NLP Copilot', text: 'Ask questions and get direct operational recommendations.' },
];

const stats = [
  { label: 'Data Formats', value: 'CSV, XLSX, XLS' },
  { label: 'Dashboard Mode', value: 'Dataset-driven only' },
  { label: 'Analytics Scope', value: 'Trend + Seasonality + Suggestions' },
];

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  const resolvedTheme = useMemo(() => resolveTheme(themeMode), [themeMode]);
  const activeTheme = themes[resolvedTheme];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const openModal = () => setIsLoginModalOpen(true);
  const closeModal = () => setIsLoginModalOpen(false);

  return (
    <div
      style={{ backgroundColor: activeTheme.bg, color: activeTheme.text }}
      className="min-h-screen selection:bg-[#00ff9d] selection:text-black font-['Inter']"
    >
      <div className="fixed inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 15% 12%, ${activeTheme.heroGlow}, transparent 38%), radial-gradient(circle at 88% 20%, ${activeTheme.heroGlow}, transparent 35%)` }} />
      <div className="fixed inset-0 bg-mesh opacity-[0.08] pointer-events-none" />

      <LoginModal isOpen={isLoginModalOpen} onClose={closeModal} />

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-7'}`}>
        <nav
          className="container mx-auto px-6 md:px-10 flex items-center justify-between rounded-full"
          style={{
            backgroundColor: scrolled ? activeTheme.card : 'transparent',
            border: `1px solid ${scrolled ? activeTheme.border : 'transparent'}`,
            backdropFilter: 'blur(14px)',
          }}
        >
          <div className="h-14 flex items-center gap-2">
            <img src="/cookiq-mark.svg" alt="CookIQ logo" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black tracking-tighter uppercase">CookIQ<span className="text-[#00ff9d]">.</span>ai</span>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            {['Forecasting', 'Upload Engine', 'Analytics', 'Copilot'].map((item) => (
              <span key={item} className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: activeTheme.muted }}>{item}</span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeModeButton />
            <button
              onClick={openModal}
              className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest"
              style={{ backgroundColor: '#00ff9d', color: '#05110b' }}
            >
              External Access
            </button>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-6 md:px-10 pt-44 pb-24 relative z-10 space-y-28">
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-10 items-center">
          <div className="fade-up">
            <div className="badge-neon mb-6 w-fit">AI Decision System</div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] mb-6">
              Predict Demand.
              <br />
              Reduce Waste.
              <br />
              Improve Margin.
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8" style={{ color: activeTheme.muted }}>
              CookIQ.ai turns raw kitchen sales data into daily prep plans, risk alerts, and clear actions.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={openModal} className="px-8 py-4 rounded-full text-sm font-black uppercase tracking-[0.15em]" style={{ backgroundColor: '#00ff9d', color: '#05110b' }}>
                Start Platform
              </button>
              <button className="px-8 py-4 rounded-full text-sm font-black uppercase tracking-[0.15em]" style={{ border: `1px solid ${activeTheme.border}` }}>
                View Product Tour
              </button>
            </div>
          </div>

          <div className="rounded-[32px] p-6 md:p-8 fade-up fade-delay-1 float-soft" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
            <h2 className="text-xl font-black uppercase tracking-tight mb-4">Live Snapshot</h2>
            <div className="space-y-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl p-4" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: activeTheme.muted }}>{item.label}</p>
                  <p className="text-lg font-black mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="fade-up fade-delay-1">
          <div className="badge-neon mb-5 w-fit">Platform Modules</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Built For Daily Kitchen Decisions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {featureCards.map((card) => (
              <div key={card.title} className="rounded-3xl p-6 transition-transform hover:-translate-y-1" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
                <p className="text-sm font-black uppercase tracking-[0.16em] mb-3">{card.title}</p>
                <p className="text-sm" style={{ color: activeTheme.muted }}>{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fade-up fade-delay-2">
          <div className="badge-neon mb-5 w-fit">How It Works</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Simple 3-Step Workflow</h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="rounded-3xl p-6" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3">Step 1</p>
              <h3 className="text-xl font-black mb-2">Upload Dataset</h3>
              <p style={{ color: activeTheme.muted }}>Import CSV/XLSX/XLS and map date, item, quantity, and revenue columns.</p>
            </div>
            <div className="rounded-3xl p-6" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3">Step 2</p>
              <h3 className="text-xl font-black mb-2">Generate Insights</h3>
              <p style={{ color: activeTheme.muted }}>Dashboard and analytics become active using your imported data only.</p>
            </div>
            <div className="rounded-3xl p-6" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-3">Step 3</p>
              <h3 className="text-xl font-black mb-2">Take Action</h3>
              <p style={{ color: activeTheme.muted }}>Use prep recommendations, alerts, and chat guidance for planning.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}