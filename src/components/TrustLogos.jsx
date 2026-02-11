export default function TrustLogos() {
    const logos = [
        { name: 'MEYER', style: 'font-bold text-gray-400' },
        { name: 'Sodexo', style: 'font-semibold italic text-gray-500' },
        { name: 'ARAMARK', style: 'font-black tracking-widest text-gray-400' },
        { name: 'COMPASS', style: 'font-medium text-gray-500' }
    ];

    return (
        <div className="pb-32 px-10">
            <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24">
                {logos.map((logo) => (
                    <div
                        key={logo.name}
                        className={`text-2xl md:text-3xl tracking-tight opacity-40 hover:opacity-80 transition-opacity duration-500 cursor-default uppercase ${logo.style}`}
                    >
                        {logo.name}
                    </div>
                ))}
            </div>
        </div>
    );
}
