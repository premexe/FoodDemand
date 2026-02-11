export default function Features() {
    return (
        <section className="px-10 py-32 bg-[#fafafa]">
            <div className="mb-20">
                <h2 className="text-5xl font-extrabold text-[#111] mb-6 tracking-tighter">Intelligent Insights.</h2>
                <p className="text-gray-500 text-lg max-w-2xl font-medium">
                    A suite of tools designed to optimize your bottom line through data-driven decisions.
                </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Card 1: Accuracy */}
                <div className="group relative bg-white border border-gray-100 rounded-[40px] p-12 shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700 overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-10">
                            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>

                        <h3 className="text-3xl font-extrabold text-black mb-4 tracking-tight">98.4% Predictive Accuracy</h3>
                        <p className="text-gray-500 mb-12 leading-relaxed font-medium">
                            Our neural networks analyze local events, weather, and historical trends to predict your covers with unmatched precision.
                        </p>

                        <div className="flex items-end gap-4 h-40">
                            {[35, 55, 40, 95, 50, 65].map((h, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-2xl bg-gradient-to-t ${i === 3 ? 'from-purple-600 to-pink-500' : 'from-gray-100 to-gray-50'} transition-all duration-700 group-hover:scale-y-105 origin-bottom`}
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Card 2: Waste Reduction */}
                <div className="group relative bg-white border border-gray-100 rounded-[40px] p-12 shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700 overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-10">
                            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>

                        <p className="text-gray-500 text-2xl font-bold mb-12 leading-snug">
                            Reduce food waste by up to 35% in your first month. Better for the planet, better for your P&L.
                        </p>

                        <div className="mt-auto flex justify-center">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="44" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                                    <circle
                                        cx="50" cy="50" r="44"
                                        fill="none" stroke="#22c55e"
                                        strokeWidth="10" strokeDasharray="276.5"
                                        strokeDashoffset="179.7"
                                        className="transition-all duration-1000 group-hover:stroke-[12]"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-black">35%</span>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mt-1">Reduction</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10 mt-10">
                {/* Quick Upload */}
                <div className="lg:col-span-1 group relative bg-white border-2 border-dashed border-gray-200 rounded-[40px] p-10 flex flex-col items-center justify-center text-center hover:border-purple-300 transition-all duration-500">
                    <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h4 className="font-bold text-2xl mb-2 text-black">Quick Upload</h4>
                    <p className="text-gray-500 font-medium">
                        Drop your historical CSV data here to start your 7-day forecast.
                    </p>
                </div>

                {/* Real-time ROI */}
                <div className="lg:col-span-2 group relative bg-white border border-gray-100 rounded-[40px] p-12 shadow-[0_20px_40px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                        <div>
                            <h4 className="font-extrabold text-3xl text-black mb-2 tracking-tight">Real-time ROI</h4>
                            <p className="text-gray-500 font-medium">
                                Watch your savings grow daily as our AI optimizes your procurement.
                            </p>
                        </div>
                        <div className="text-left md:text-right">
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-2">Monthly Savings</p>
                            <p className="text-5xl font-black text-green-500">$12,482</p>
                        </div>
                    </div>
                    <div className="flex gap-3 h-24">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className={`flex-1 rounded-2xl ${i % 2 === 0 ? 'bg-gradient-to-t from-purple-500 to-pink-500' : 'bg-gray-50'} transition-all duration-500 group-hover:opacity-90`} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
