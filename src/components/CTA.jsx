export default function CTA({ onLoginClick }) {
    return (
        <section className="px-10 py-32">
            <div className="relative rounded-[60px] overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 border border-gray-100 p-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-60" />

                <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-[#111] mb-6 tracking-tighter">
                        Join 500+ premium kitchens worldwide and start forecasting today.
                    </h2>
                    <p className="text-gray-500 mb-12 text-xl font-medium">
                        No credit card required. Start your 14-day free trial now.
                    </p>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full">
                        <input
                            type="email"
                            placeholder="Your work email"
                            className="w-full md:w-96 px-8 py-5 rounded-full bg-white border border-gray-200 text-black focus:outline-none focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
                        />
                        <button
                            onClick={onLoginClick}
                            className="w-full md:w-auto px-10 py-5 rounded-full bg-black text-white font-bold text-lg hover:scale-105 transition-all shadow-xl active:scale-95"
                        >
                            Start Free Trial
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
