import { useEffect, useMemo, useState } from 'react';

const THEME_KEY = 'fooddemand.home.theme';
const THEME_EVENT = 'fd-theme-change';

function resolveTheme(mode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return mode === 'light' ? 'light' : 'dark';
}

export default function ThemeModeButton({ className = '' }) {
  const [mode, setMode] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const resolvedTheme = useMemo(() => resolveTheme(mode), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-app-theme', resolvedTheme);
    document.documentElement.style.colorScheme = resolvedTheme;
    localStorage.setItem(THEME_KEY, resolvedTheme);
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { mode: resolvedTheme } }));
  }, [resolvedTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (mode === 'system') {
        const next = resolveTheme('system');
        document.documentElement.setAttribute('data-app-theme', next);
        window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { mode: next } }));
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [mode]);

  return (
    <button
      type="button"
      aria-label="Toggle dark light mode"
      onClick={() => setMode((prev) => (resolveTheme(prev) === 'dark' ? 'light' : 'dark'))}
      className={`h-10 w-10 rounded-full backdrop-blur-lg flex items-center justify-center transition-colors ${className}`}
      style={{
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(8, 12, 10, 0.55)' : 'rgba(255, 255, 255, 0.68)',
        border: `1px solid ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.24)' : 'rgba(15,23,20,0.24)'}`,
      }}
    >
      {resolvedTheme === 'dark' ? (
        <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1 1 11.21 3c.12 0 .25 0 .37.01A7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-[#111]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1zM4.22 5.64a1 1 0 0 1 1.42 0l1.42 1.41a1 1 0 0 1-1.42 1.42L4.22 7.05a1 1 0 0 1 0-1.41zm12.72 12.72a1 1 0 0 1 1.42 0l1.42 1.41a1 1 0 1 1-1.42 1.42l-1.42-1.41a1 1 0 0 1 0-1.42zM2 13a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2H2zm18 0a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2h-2zM5.64 19.78a1 1 0 0 1 0-1.42l1.41-1.42a1 1 0 0 1 1.42 1.42l-1.41 1.42a1 1 0 0 1-1.42 0zm12.72-12.72a1 1 0 0 1 0-1.42l1.41-1.42a1 1 0 1 1 1.42 1.42l-1.41 1.42a1 1 0 0 1-1.42 0z" />
        </svg>
      )}
    </button>
  );
}
