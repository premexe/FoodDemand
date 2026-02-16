import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getCurrentUser, logout } from '../auth/auth';
import ThemeModeButton from './ThemeModeButton';

const THEME_KEY = 'fooddemand.home.theme';
const THEME_EVENT = 'fd-theme-change';

const themes = {
  dark: {
    bg: '#050607',
    text: '#ffffff',
    muted: 'rgba(255,255,255,0.72)',
    soft: 'rgba(255,255,255,0.05)',
    border: 'rgba(255,255,255,0.09)',
    header: 'rgba(5,6,7,0.8)',
  },
  light: {
    bg: '#f7faf7',
    text: '#000000',
    muted: 'rgba(0,0,0,0.72)',
    soft: 'rgba(16,21,19,0.05)',
    border: 'rgba(16,21,19,0.12)',
    header: 'rgba(247,250,247,0.88)',
  },
};

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/upload', label: 'Upload Data' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/profile', label: 'Profile' },
];

export default function AuthenticatedSectionLayout({ title, subtitle, children }) {
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
  const cardStyle = {
    backgroundColor: activeTheme.soft,
    border: `1px solid ${activeTheme.border}`,
  };

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

  return (
    <div
      style={{ backgroundColor: activeTheme.bg, color: activeTheme.text }}
      className="min-h-screen font-['Inter'] selection:bg-[#00ff9d] selection:text-black"
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: resolvedTheme === 'dark'
            ? 'radial-gradient(circle at 12% 8%, rgba(0,255,157,0.12), transparent 35%), radial-gradient(circle at 92% 14%, rgba(125,255,209,0.12), transparent 32%), radial-gradient(circle at 50% 110%, rgba(0,255,157,0.08), transparent 42%)'
            : 'radial-gradient(circle at 12% 8%, rgba(0,180,110,0.1), transparent 35%), radial-gradient(circle at 92% 14%, rgba(0,180,110,0.08), transparent 32%), radial-gradient(circle at 50% 110%, rgba(0,180,110,0.08), transparent 42%)',
        }}
      />

      <header className="fixed inset-x-0 top-0 z-50 transition-all duration-500 px-6 md:px-10 py-5">
        <nav
          className="mx-auto max-w-7xl rounded-full backdrop-blur-xl px-6 md:px-8"
          style={{
            backgroundColor: scrolled ? activeTheme.header : 'transparent',
            border: `1px solid ${scrolled ? activeTheme.border : 'transparent'}`,
          }}
        >
          <div className="h-14 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xl font-black tracking-tight uppercase"
            >
              CookIQ<span className="text-[#00ff9d]">.</span>ai
            </button>

            <div className="hidden lg:flex items-center gap-9">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `text-[11px] font-bold uppercase tracking-[0.2em] transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <ThemeModeButton />
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-10 pt-40 pb-24 relative z-10">
        <div className="badge-neon mb-6 w-fit">CookIQ.ai Workspace</div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase mb-4">{title}</h1>
        <p className="max-w-3xl text-base md:text-lg mb-10" style={{ color: activeTheme.muted }}>
          {subtitle}
        </p>
        {children({
          activeTheme,
          cardStyle,
          user,
          resolvedTheme,
          onLogout: () => {
            logout();
            navigate('/', { replace: true });
          },
        })}
      </main>
    </div>
  );
}
