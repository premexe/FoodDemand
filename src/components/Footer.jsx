export default function Footer() {
    const links = {
        PRODUCT: ['Forecasting', 'Inventory', 'Integrations'],
        COMPANY: ['About', 'Sustainability', 'Privacy'],
        SUPPORT: ['Docs', 'Help Center', 'Contact']
    };

    return (
        <footer className="px-10 py-32 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 text-2xl font-black tracking-tighter mb-8 cursor-pointer">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
                        <span className="text-black">CookIQ.ai</span>
                    </div>
                    <p className="text-gray-500 max-w-sm font-medium leading-relaxed">
                        Empowering the culinary world through intelligent data orchestration and precision forecasting.
                    </p>
                </div>

                {Object.entries(links).map(([title, items]) => (
                    <div key={title}>
                        <h4 className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-8">{title}</h4>
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li key={item}>
                                    <a href="#" className="text-gray-500 hover:text-black font-bold text-sm transition-colors duration-300">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-gray-100 text-[11px] font-bold text-gray-400 gap-8">
                <div>© 2024 CoolQ.ai Inc. Built for precision.</div>
                <div className="flex gap-10">
                    <a href="#" className="hover:text-black transition-colors">Twitter</a>
                    <a href="#" className="hover:text-black transition-colors">LinkedIn</a>
                    <a href="#" className="hover:text-black transition-colors">Instagram</a>
                </div>
            </div>
        </footer>
    );
}
