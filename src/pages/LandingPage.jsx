import { useEffect, useMemo, useRef, useState } from 'react';
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
const clientShowcase = [
  { name: 'McDonald\'s', logoSlug: 'mcdonalds' },
  { name: 'KFC', logoSlug: 'kfc' },
  { name: 'Subway', logoSlug: 'subway' },
  { name: 'Domino\'s', logoSlug: 'dominos' },
  { name: 'Pizza Hut', logoSlug: 'pizzahut' },
  { name: 'Starbucks', logoSlug: 'starbucks' },
  { name: 'Burger King', logoSlug: 'burgerking' },
  { name: 'Marriott', logoSlug: 'marriott' },
  { name: 'Hyatt', logoSlug: 'hyatt' },
  { name: 'Hilton', logoSlug: 'hilton' },
  { name: 'Accor', logoSlug: 'accor' },
  { name: 'Zomato', logoSlug: 'zomato' },
  { name: 'Swiggy', logoSlug: 'swiggy' },
  { name: 'Uber Eats', logoSlug: 'ubereats' },
];
const reviewShowcase = [
  {
    name: 'Aarav Mehta',
    role: 'Operations Lead, Bistro One',
    date: 'Feb 10, 2026',
    rating: 5,
    quote: 'CookIQ helped us reduce over-prep by nearly 18% within three weeks. The daily demand cues are practical and easy to execute.',
  },
  {
    name: 'Sophia Lewis',
    role: 'Kitchen Manager, Urban Plate',
    date: 'Feb 03, 2026',
    rating: 5,
    quote: 'The forecast + alerts changed our shift planning. We now prep by service window and see fewer stockouts during peak hours.',
  },
  {
    name: 'Rohan Iyer',
    role: 'Owner, Spice District',
    date: 'Jan 29, 2026',
    rating: 4,
    quote: 'Upload and mapping are smooth. The dashboard gives us confidence for next-day production without excessive safety buffers.',
  },
  {
    name: 'Mia Carter',
    role: 'Regional Ops, BlueFork Hotels',
    date: 'Jan 21, 2026',
    rating: 5,
    quote: 'Across multiple outlets, consistency improved. The insights section is clear enough for both chefs and non-technical managers.',
  },
];

export default function LandingPage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [headerLogoBroken, setHeaderLogoBroken] = useState(false);
  const [isMarqueeHovered, setIsMarqueeHovered] = useState(false);
  const [isMarqueeDragging, setIsMarqueeDragging] = useState(false);
  const [isReviewHovered, setIsReviewHovered] = useState(false);
  const [isReviewDragging, setIsReviewDragging] = useState(false);
  const [botEyes, setBotEyes] = useState({ dx: 0, dy: 0 });
  const marqueeTrackRef = useRef(null);
  const marqueeOffsetRef = useRef(0);
  const marqueeLoopWidthRef = useRef(0);
  const dragRef = useRef({ active: false, startX: 0, startOffset: 0 });
  const reviewTrackRef = useRef(null);
  const reviewOffsetRef = useRef(0);
  const reviewLoopWidthRef = useRef(0);
  const reviewDragRef = useRef({ active: false, startX: 0, startOffset: 0 });
  const botAvatarRef = useRef(null);

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
  const marqueePaused = isMarqueeHovered || isMarqueeDragging;
  const reviewPaused = isReviewHovered || isReviewDragging;

  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return undefined;

    const updateLoopWidth = () => {
      marqueeLoopWidthRef.current = track.scrollWidth / 2;
    };

    updateLoopWidth();
    const observer = new ResizeObserver(updateLoopWidth);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = reviewTrackRef.current;
    if (!track) return undefined;

    const updateLoopWidth = () => {
      reviewLoopWidthRef.current = track.scrollWidth / 2;
    };

    updateLoopWidth();
    const observer = new ResizeObserver(updateLoopWidth);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = marqueeTrackRef.current;
    if (!track) return undefined;

    let rafId = 0;
    let lastTime = performance.now();

    const applyOffset = (offset) => {
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const normalizeOffset = (offset) => {
      const loopWidth = marqueeLoopWidthRef.current;
      if (!loopWidth) return 0;
      let next = offset;
      while (next <= -loopWidth) next += loopWidth;
      while (next > 0) next -= loopWidth;
      return next;
    };

    const tick = (time) => {
      const dt = Math.min(48, time - lastTime);
      lastTime = time;

      if (!marqueePaused && marqueeLoopWidthRef.current > 0) {
        const velocity = -0.085;
        marqueeOffsetRef.current = normalizeOffset(marqueeOffsetRef.current + velocity * dt);
        applyOffset(marqueeOffsetRef.current);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [marqueePaused]);

  useEffect(() => {
    const track = reviewTrackRef.current;
    if (!track) return undefined;

    let rafId = 0;
    let lastTime = performance.now();

    const applyOffset = (offset) => {
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const normalizeOffset = (offset) => {
      const loopWidth = reviewLoopWidthRef.current;
      if (!loopWidth) return 0;
      let next = offset;
      while (next <= -loopWidth) next += loopWidth;
      while (next > 0) next -= loopWidth;
      return next;
    };

    const tick = (time) => {
      const dt = Math.min(48, time - lastTime);
      lastTime = time;

      if (!reviewPaused && reviewLoopWidthRef.current > 0) {
        const velocity = -0.075;
        reviewOffsetRef.current = normalizeOffset(reviewOffsetRef.current + velocity * dt);
        applyOffset(reviewOffsetRef.current);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [reviewPaused]);

  useEffect(() => {
    const updateEyeOffset = (clientX, clientY) => {
      if (!botAvatarRef.current) return;
      const rect = botAvatarRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const cap = Math.min(1, dist / 180);
      setBotEyes({
        dx: nx * 4.5 * cap,
        dy: ny * 3.5 * cap,
      });
    };

    const onMouseMove = (event) => updateEyeOffset(event.clientX, event.clientY);
    const onTouchMove = (event) => {
      const touch = event.touches?.[0];
      if (touch) updateEyeOffset(touch.clientX, touch.clientY);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  const handleMarqueePointerDown = (event) => {
    if (marqueeLoopWidthRef.current <= 0) return;
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startOffset: marqueeOffsetRef.current,
    };
    setIsMarqueeDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMarqueePointerMove = (event) => {
    if (!dragRef.current.active || marqueeLoopWidthRef.current <= 0) return;
    const dx = event.clientX - dragRef.current.startX;
    const loopWidth = marqueeLoopWidthRef.current;
    let next = dragRef.current.startOffset + dx;
    while (next <= -loopWidth) next += loopWidth;
    while (next > 0) next -= loopWidth;
    marqueeOffsetRef.current = next;
    if (marqueeTrackRef.current) {
      marqueeTrackRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
    }
  };

  const handleMarqueePointerUp = (event) => {
    if (dragRef.current.active) {
      dragRef.current.active = false;
      setIsMarqueeDragging(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture release errors.
      }
    }
  };

  const handleReviewPointerDown = (event) => {
    if (reviewLoopWidthRef.current <= 0) return;
    reviewDragRef.current = {
      active: true,
      startX: event.clientX,
      startOffset: reviewOffsetRef.current,
    };
    setIsReviewDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleReviewPointerMove = (event) => {
    if (!reviewDragRef.current.active || reviewLoopWidthRef.current <= 0) return;
    const dx = event.clientX - reviewDragRef.current.startX;
    const loopWidth = reviewLoopWidthRef.current;
    let next = reviewDragRef.current.startOffset + dx;
    while (next <= -loopWidth) next += loopWidth;
    while (next > 0) next -= loopWidth;
    reviewOffsetRef.current = next;
    if (reviewTrackRef.current) {
      reviewTrackRef.current.style.transform = `translate3d(${next}px, 0, 0)`;
    }
  };

  const handleReviewPointerUp = (event) => {
    if (reviewDragRef.current.active) {
      reviewDragRef.current.active = false;
      setIsReviewDragging(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture release errors.
      }
    }
  };

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
            {!headerLogoBroken ? (
              <img
                src="/cookiq-mark.svg"
                alt="CookIQ logo"
                className="w-8 h-8 rounded-lg object-contain shrink-0"
                onError={() => setHeaderLogoBroken(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: activeTheme.card, border: `1px solid ${activeTheme.border}` }}>
                CQ
              </div>
            )}
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
        <section className="max-w-4xl fade-up">
          <div>
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

<section className="fade-up fade-delay-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <div className="badge-neon mb-3 w-fit">Our Clients</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">Active Kitchen Network</h2>
            </div>
          </div>
          <div
            className={`client-marquee-mask rounded-3xl py-6 ${isMarqueeDragging ? 'is-grabbing' : ''}`}
            style={{ backgroundColor: 'transparent', border: 'none' }}
            onMouseEnter={() => setIsMarqueeHovered(true)}
            onMouseLeave={() => setIsMarqueeHovered(false)}
            onPointerDown={handleMarqueePointerDown}
            onPointerMove={handleMarqueePointerMove}
            onPointerUp={handleMarqueePointerUp}
            onPointerCancel={handleMarqueePointerUp}
          >
            <div ref={marqueeTrackRef} className="client-marquee-track">
              {[...clientShowcase, ...clientShowcase].map((client, index) => (
                <div key={`${client.name}_${index}`} className="client-marquee-item">
                  <img
                    src={`https://cdn.simpleicons.org/${client.logoSlug}/B6C2D3`}
                    alt={`${client.name} logo`}
                    className="client-marquee-logo"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  <p className="text-base md:text-[26px] font-black leading-none uppercase tracking-tight" style={{ color: activeTheme.muted }}>
                    {client.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

<section className="fade-up fade-delay-2">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <div className="badge-neon mb-3 w-fit">Customer Reviews</div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight">What Teams Say</h2>
            </div>
          </div>
          <div
            className={`review-marquee-mask rounded-3xl py-2 ${isReviewDragging ? 'is-grabbing' : ''}`}
            onMouseEnter={() => setIsReviewHovered(true)}
            onMouseLeave={() => setIsReviewHovered(false)}
            onPointerDown={handleReviewPointerDown}
            onPointerMove={handleReviewPointerMove}
            onPointerUp={handleReviewPointerUp}
            onPointerCancel={handleReviewPointerUp}
          >
            <div ref={reviewTrackRef} className="review-marquee-track">
              {[...reviewShowcase, ...reviewShowcase].map((review, index) => (
                <article key={`${review.name}_${index}`} className="review-marquee-card">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs tracking-[0.24em] text-[#ffcc66]">{'★★★★★'.slice(0, review.rating)}</p>
                    <p className="text-[11px] font-semibold" style={{ color: activeTheme.muted }}>{review.date}</p>
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: activeTheme.muted }}>
                    {review.quote}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="review-avatar" aria-hidden="true">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-black leading-tight">{review.name}</p>
                      <p className="text-xs font-semibold" style={{ color: activeTheme.muted }}>{review.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>

      <div className="bot-avatar-widget" aria-hidden="true">
        <svg
          ref={botAvatarRef}
          viewBox="0 0 300 300"
          className="bot-avatar-svg"
          role="img"
          aria-label="Assistant bot avatar"
        >
          <defs>
            <linearGradient id="botCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7EF4FF" />
              <stop offset="55%" stopColor="#2FD8FF" />
              <stop offset="100%" stopColor="#11A5FF" />
            </linearGradient>
            <linearGradient id="botFace" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374154" />
              <stop offset="100%" stopColor="#212A3A" />
            </linearGradient>
          </defs>

          <circle cx="150" cy="34" r="16" fill="url(#botCyan)" />
          <rect x="136" y="44" width="28" height="16" rx="8" fill="url(#botCyan)" />

          <circle cx="50" cy="155" r="34" fill="url(#botCyan)" />
          <circle cx="250" cy="155" r="34" fill="url(#botCyan)" />

          <rect x="36" y="66" width="228" height="186" rx="92" fill="url(#botCyan)" />
          <rect x="68" y="104" width="164" height="118" rx="34" fill="url(#botFace)" />

          <ellipse cx={116 + botEyes.dx} cy={160 + botEyes.dy} rx="14" ry="18" fill="#F2F7FA" />
          <ellipse cx={184 + botEyes.dx} cy={160 + botEyes.dy} rx="14" ry="18" fill="#F2F7FA" />

          <path d="M122 194C136 210 164 210 178 194" stroke="#F2F7FA" strokeWidth="10" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}




