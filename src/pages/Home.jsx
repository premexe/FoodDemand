import { useState, useEffect } from "react";
import LoginModal from "../components/LoginModal";

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openModal = () => setIsLoginModalOpen(true);
  const closeModal = () => setIsLoginModalOpen(false);

  return (
    <div className="bg-black min-h-screen text-white selection:bg-[#00ff9d] selection:text-black font-['Inter']">
      <div className="fixed inset-0 bg-mesh opacity-[0.1] pointer-events-none" />

      <LoginModal isOpen={isLoginModalOpen} onClose={closeModal} />

      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <nav className="container mx-auto px-10 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-black rounded-sm" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">CookIQ<span className="text-[#00ff9d]">.</span>ai</span>
          </div>

          <div className="hidden lg:flex items-center gap-12">
            {["Neural Core", "Forecasting", "Enterprise", "Careers"].map((item) => (
              <a key={item} href="#" className="text-[11px] font-bold text-white/40 hover:text-white transition-all uppercase tracking-[0.2em]">{item}</a>
            ))}
          </div>

          <button onClick={openModal} className="px-6 py-2.5 bg-white text-black text-[11px] font-black rounded-full hover:bg-[#00ff9d] transition-all uppercase tracking-widest">
            External Access
          </button>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-64 pb-32 px-10 container mx-auto">
          <div className="max-w-4xl">
            <div className="badge-neon mb-10 w-fit">Active Mission / 2024.V4</div>
            <h1 className="text-[80px] md:text-[120px] font-black tracking-tighter leading-[0.9] mb-12 text-reveal">
              Master the<br />
              Art of<br />
              Precision<span className="text-[#00ff9d]">.</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/40 mb-16 max-w-xl font-medium leading-relaxed font-sans">
              Engineered for the elite. A neural engine that transforms raw culinary data into operational perfection.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button onClick={openModal} className="px-10 py-5 bg-[#00ff9d] text-black font-black rounded-full text-sm hover:scale-105 transition-all uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,157,0.3)]">
                Apply for Release
              </button>
              <button className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black rounded-full text-sm hover:bg-white/10 transition-all uppercase tracking-widest">
                View Demo
              </button>
            </div>
          </div>

          {/* Abstract Hero Visual - Subtle oval wireframe */}
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[900px] border border-white/5 rounded-full rotate-[15deg] hidden lg:block pointer-events-none">
            <div className="absolute inset-[10%] border border-white/5 rounded-full" />
            <div className="absolute inset-[25%] border border-white/5 rounded-full" />
          </div>
        </section>

        {/* Intelligence Section */}
        <section className="py-40 px-10 container mx-auto text-center">
          <div className="badge-neon mb-8 mx-auto w-fit">Neural Architecture</div>
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-24">
            Intelligence,<br />Reimagined.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto text-left">
            {/* Main Feature Card */}
            <div className="bento-card col-span-1 md:col-span-2 p-12">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter uppercase mb-2">Demand Trajectory</h3>
                  <p className="text-white/40 max-w-xs text-sm">Predictive forecasting mapped against high-fidelity historical patterns.</p>
                </div>
                <div className="badge-neon">Live Training</div>
              </div>

              {/* SVG Wave Chart Mockup */}
              <div className="mt-12 h-64 w-full relative">
                <svg className="w-full h-full opacity-60" viewBox="0 0 800 200">
                  <path
                    d="M0,150 C100,120 200,180 300,140 C400,100 500,160 600,120 C700,80 800,110 800,110 L800,200 L0,200 Z"
                    fill="url(#wave-gradient)"
                  />
                  <defs>
                    <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff9d" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00ff9d" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,150 C100,120 200,180 300,140 C400,100 500,160 600,120 C700,80 800,110 800,110"
                    fill="none"
                    stroke="#00ff9d"
                    strokeWidth="3"
                  />
                </svg>
              </div>
            </div>

            {/* Side Feature Card */}
            <div className="bento-card p-12 bg-white/5 border-none">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-8">
                <div className="w-6 h-6 border-2 border-white/20 rounded-full flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
              <h3 className="text-3xl font-black tracking-tighter uppercase mb-6">Neural Inference</h3>
              <p className="text-white/40 text-sm mb-12">Proprietary logic models that analyze millions of variables to anticipate surges before they materialize.</p>

              <div className="mt-auto pt-8 border-t border-white/5 flex items-end justify-between">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Confidence Index</span>
                <span className="text-5xl font-black tracking-tighter text-[#00ff9d]">99.0%</span>
              </div>
            </div>

            {/* Bottom Row Small Cards */}
            <div className="bento-card p-10">
              <div className="badge-neon mb-6 w-fit h-fit"><span className="material-symbols-outlined text-xs">adjust</span></div>
              <h4 className="text-xl font-black tracking-tighter uppercase mb-3">Omni-Channel Synthesis</h4>
              <p className="text-white/40 text-sm">Unified data streams from POS, inventory, and global logistics into a singular interface.</p>
            </div>

            <div className="bento-card p-10">
              <div className="badge-neon mb-6 w-fit h-fit"><span className="material-symbols-outlined text-xs">lock</span></div>
              <h4 className="text-xl font-black tracking-tighter uppercase mb-3">Encrypted Ledger</h4>
              <p className="text-white/40 text-sm">Bank-grade security protocols for your culinary intellectual and operational assets.</p>
            </div>

            <div className="bento-card p-10">
              <div className="badge-neon mb-6 w-fit h-fit"><span className="material-symbols-outlined text-xs">recycling</span></div>
              <h4 className="text-xl font-black tracking-tighter uppercase mb-3">Zero Waste Protocol</h4>
              <p className="text-white/40 text-sm">Real-time optimization engine that tracks and eliminates surplus by up to 40%.</p>
            </div>
          </div>
        </section>

        {/* Yield Section */}
        <section className="py-40 px-10 container mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2">
              <div className="badge-neon mb-8">System Performance</div>
              <h2 className="text-7xl md:text-[100px] font-black tracking-tighter leading-[0.9] mb-8 uppercase">
                Elite-Tier<br />Yield.
              </h2>
              <p className="text-xl text-white/40 mb-12 max-w-md font-medium">
                We architect profit by eliminating the delta between guesswork and reality.
              </p>
              <button className="px-10 py-5 bg-[#00ff9d] text-black font-black rounded-full text-sm hover:scale-105 transition-all uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,157,0.3)]">
                Tracked Audit
              </button>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="bento-card p-12 bg-white/5 border-none">
                <div className="flex justify-between items-center mb-12">
                  <h3 className="text-xl font-black tracking-tighter uppercase">Waste vs. Revenue</h3>
                  <div className="badge-neon">Verified</div>
                </div>

                <div className="space-y-12">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Revenue Growth</span>
                      <span className="text-4xl font-black tracking-tighter text-[#00ff9d]">+24.5%</span>
                    </div>
                    <div className="metric-bar"><div className="metric-fill w-[85%]" /></div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Waste reduction</span>
                      <span className="text-4xl font-black tracking-tighter text-white">-38.2%</span>
                    </div>
                    <div className="metric-bar bg-white/5"><div className="h-full bg-white/20 rounded-full w-[65%]" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-64 px-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#00ff9d]/5 to-black pointer-events-none" />
          <div className="container mx-auto relative z-10">
            <h2 className="text-[100px] md:text-[200px] font-black tracking-tighter uppercase leading-none mb-20 italic">
              Begin <span className="text-[#00ff9d]">Now.</span>
            </h2>
            <button onClick={openModal} className="px-16 py-8 bg-[#00ff9d] text-black font-black rounded-full text-xl hover:scale-110 transition-all uppercase tracking-widest shadow-[0_0_50px_rgba(0,255,157,0.4)]">
              Contact Specialist
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-24 px-10 border-t border-white/5">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="space-y-8 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white/20 rounded-sm" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">CookIQ.ai</span>
            </div>
            <p className="text-white/20 text-xs font-medium leading-loose max-w-[240px]">
              The leading enterprise AI for modern kitchens. Engineered to a 0.01% daily variance in global logistics.
            </p>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocols</h5>
            <ul className="space-y-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">
              <li className="hover:text-[#00ff9d] transition-colors cursor-pointer">Neural Core</li>
              <li className="hover:text-[#00ff9d] transition-colors cursor-pointer">Forecasting</li>
              <li className="hover:text-[#00ff9d] transition-colors cursor-pointer">Security Stack</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Team</h5>
            <ul className="space-y-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">
              <li className="hover:text-[#00ff9d] transition-colors cursor-pointer">Our Mission</li>
              <li className="hover:text-[#00ff9d] transition-colors cursor-pointer">Client cases</li>
              <li className="hover:text-[#00ff9d] transition-colors cursor-pointer">Careers</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Newsletter</h5>
            <div className="flex border-b border-white/10 pb-4">
              <input
                type="email"
                placeholder="JOURNAL EMAIL"
                className="bg-transparent border-none text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none flex-1 placeholder:text-white/10"
              />
              <button className="text-white/20 hover:text-[#00ff9d] transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">© 2024 COOKIQ.AI / ALL SYSTEMS OPERATIONAL.</p>
          <div className="flex gap-10 text-[10px] font-bold text-white/20 uppercase tracking-widest">
            <span className="hover:text-white transition-colors cursor-pointer">Legal</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Social</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

