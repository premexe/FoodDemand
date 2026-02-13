import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../auth/auth';
import ThemeModeButton from '../components/ThemeModeButton';

const THEME_KEY = 'fooddemand.home.theme';
const THEME_EVENT = 'fd-theme-change';

const links = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'impact', label: 'Impact' },
  { id: 'contact', label: 'Contact' },
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
        <section id="overview" className="container mx-auto px-10 pt-40 pb-24">
          <div className="badge-neon mb-8 w-fit">Logged In Home</div>
          <h1 className="text-[64px] md:text-[100px] font-black tracking-tighter leading-[0.92] mb-8 text-reveal">
            Master the<br />
            Art of<br />
            Precision<span className="text-[#00ff9d]">.</span>
          </h1>
          <p className="max-w-2xl text-lg md:text-xl" style={{ color: activeTheme.muted }}>
            Welcome back{user?.name ? `, ${user.name}` : ''}. This is your post-login home page with a landing-page structure and section-based navigation.
          </p>
        </section>

        <section id="features" className="container mx-auto px-10 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="bento-card p-9" style={cardStyle}>
              <h3 className="text-2xl font-black tracking-tight uppercase mb-3">Demand Signals</h3>
              <p style={{ color: activeTheme.muted }}>Track shifts faster with sectioned intelligence blocks and simplified operational views.</p>
            </article>
            <article className="bento-card p-9" style={cardStyle}>
              <h3 className="text-2xl font-black tracking-tight uppercase mb-3">Forecast Accuracy</h3>
              <p style={{ color: activeTheme.muted }}>Bring the same high-impact visual style from landing into your logged-in experience.</p>
            </article>
            <article className="bento-card p-9" style={cardStyle}>
              <h3 className="text-2xl font-black tracking-tight uppercase mb-3">Action Blocks</h3>
              <p style={{ color: activeTheme.muted }}>Organize workflows by sections so the navbar maps directly to what teams need.</p>
            </article>
          </div>
        </section>

        <section id="impact" className="container mx-auto px-10 py-20">
          <div className="bento-card p-12" style={cardStyle}>
            <div className="badge-neon mb-6 w-fit">Impact</div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tight uppercase mb-8">Operate With Confidence</h2>
            <p className="text-lg max-w-3xl" style={{ color: activeTheme.muted }}>
              Keep this page focused on key metrics and next actions. The theme switcher persists your preference across sessions.
            </p>
          </div>
        </section>

        <section id="contact" className="container mx-auto px-10 py-12">
          <div className="bento-card p-10 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between" style={cardStyle}>
            <div>
              <h3 className="text-3xl font-black uppercase tracking-tight">Need A Deep Dive?</h3>
              <p style={{ color: activeTheme.muted }}>Open your analytics dashboard or contact your specialist from here.</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-[#00ff9d] text-black font-black rounded-full text-sm uppercase tracking-widest"
            >
              Open Dashboard
            </button>
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
                onClick={() => navigate('/dashboard')}
                className="px-7 py-3 bg-[#00ff9d] text-black rounded-full text-sm font-black uppercase tracking-widest"
              >
                Open Dashboard
              </button>
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
