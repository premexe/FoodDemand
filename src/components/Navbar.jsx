export default function Navbar({ onLoginClick }) {
  return (
    <nav className="flex items-center justify-between px-10 py-8">
      <div className="flex items-center gap-3 text-2xl font-black tracking-tighter cursor-pointer">
        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
        <span className="text-black font-black tracking-tighter">CookIQ.ai</span>
      </div>

      <ul className="hidden lg:flex items-center gap-10 text-[13px] font-bold text-gray-400">
        <li className="hover:text-black cursor-pointer transition-colors">Features</li>
        <li className="hover:text-black cursor-pointer transition-colors">How it works</li>
        <li className="hover:text-black cursor-pointer transition-colors">Predictions</li>
        <li className="hover:text-black cursor-pointer transition-colors">Stories</li>
        <li className="hover:text-black cursor-pointer transition-colors">Contact</li>
      </ul>

      <div className="flex items-center gap-6">
        <button
          onClick={onLoginClick}
          className="text-sm font-bold text-gray-500 hover:text-black transition-colors"
        >
          Login
        </button>
        <button
          onClick={onLoginClick}
          className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:scale-105 transition-all"
        >
          Try free
        </button>
      </div>
    </nav>
  );
}
