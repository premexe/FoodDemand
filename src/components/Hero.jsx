import Stats from "./Stats";
import ProfileCard from "./ProfileCard";

export default function Hero({ onLoginClick }) {
  return (
    <section className="flex flex-col items-center text-center px-10 pt-20 pb-10 min-h-[80vh] relative overflow-hidden">
      {/* Decorative Gradient Background (Behind text) */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[70%] h-[250px] bg-gradient-to-r from-blue-400/20 via-purple-400/30 to-pink-400/40 blur-[100px] -z-10 opacity-60 rounded-[40px]" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/5 backdrop-blur-md mb-8">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">THE FUTURE OF FOOD SERVICE</span>
      </div>

      {/* Heading */}
      <div className="relative max-w-4xl mx-auto">
        <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter text-[#111] mb-8">
          Precision in Every Plate.
        </h1>

        {/* Color Block (as seen in image) */}
        <div className="w-[85%] h-36 mx-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[24px] shadow-2xl mb-12" />
      </div>

      {/* Subtext */}
      <p className="text-gray-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed mb-12">
        AI-driven demand forecasting that eliminates food waste and maximizes kitchen efficiency. Designed for the modern restaurateur.
      </p>

      {/* Buttons */}
      <div className="flex flex-col md:flex-row items-center gap-6 mb-24">
        <button
          onClick={onLoginClick}
          className="bg-black text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-black/90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)]"
        >
          Get Started Now
        </button>
        <button className="flex items-center gap-3 bg-white text-black border border-gray-100 px-12 py-5 rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(0,0,0,0.05)]">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
          </svg>
          Watch Vision
        </button>
      </div>

      {/* Partner Logos Label */}
      <div className="mt-auto w-full">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500 mb-8">TRUSTED BY GLOBAL KITCHENS</div>
      </div>
    </section>
  );
}
