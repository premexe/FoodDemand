export default function ProfileCard() {
  return (
    <div className="relative bg-white rounded-3xl p-4 w-[320px] text-black">
      <img
        src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
        alt="Consultant"
        className="rounded-2xl h-[380px] w-full object-cover"
      />

      {/* Floating chat */}
      <div className="absolute top-6 right-4 bg-white shadow-md px-4 py-2 rounded-xl text-xs">
        Schedules 📊
      </div>

      <div className="absolute bottom-20 right-4 bg-white shadow-md px-4 py-2 rounded-xl text-xs flex items-center gap-2">
        Book a consultation
        <button className="bg-black text-white px-2 py-1 rounded-full text-[10px]">
          Chat
        </button>
      </div>

      {/* Footer */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-sm">
            Simon Holdings <span className="text-blue-500">✔</span>
          </h4>
          <p className="text-xs text-gray-500">Consultations</p>
        </div>

        <div className="flex gap-4 text-center">
          <div>
            <p className="font-bold text-sm">170</p>
            <p className="text-xs text-gray-500">Consultations</p>
          </div>
          <div>
            <p className="font-bold text-sm">158</p>
            <p className="text-xs text-gray-500">Happy Clients</p>
          </div>
        </div>
      </div>
    </div>
  );
}
