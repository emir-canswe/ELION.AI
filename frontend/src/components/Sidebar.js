const menuItems = [
    { id: "dashboard", label: "🏠 Ana Sayfa" },
    { id: "kitaplar", label: "📚 Kitaplar" },
    { id: "filmler", label: "🎬 Filmler" },
    { id: "hatirlatmalar", label: "⏰ Hatırlatmalar" },
    { id: "gunluk", label: "📖 Günlük" },
    { id: "dosyalar", label: "📁 Dosyalar" },
    { id: "whatsapp", label: "💬 WhatsApp" },
];

function Sidebar({ aktif, setAktif }) {
    return (
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-cyan-400">⚡ Elion</h1>
                <p className="text-gray-400 text-sm mt-1">Kişisel Asistan</p>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setAktif(item.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${aktif === item.id
                                ? "bg-cyan-500 text-white font-semibold"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <p className="text-gray-600 text-xs text-center">Elion v2.0</p>
            </div>
        </div>
    );
}

export default Sidebar;