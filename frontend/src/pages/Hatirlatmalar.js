import { useState, useEffect } from "react";
import axios from "axios";

function Hatirlatmalar() {
    const [hatirlatmalar, setHatirlatmalar] = useState([]);
    const [metin, setMetin] = useState("");
    const [tarih, setTarih] = useState("");

    useEffect(() => {
        hatirlatmalariGetir();
    }, []);

    const hatirlatmalariGetir = () => {
        axios.get("http://localhost:8000/hatirlatmalar")
            .then(r => setHatirlatmalar(r.data))
            .catch(e => console.error(e));
    };

    const hatirlatmaEkle = () => {
        if (!metin.trim() || !tarih) return;
        const tarihDuzenlenmis = tarih.replace("T", " ").slice(0, 16);
        axios.post("http://localhost:8000/hatirlatmalar", {
            metin,
            tarih_saat: tarihDuzenlenmis
        }).then(() => {
            setMetin("");
            setTarih("");
            hatirlatmalariGetir();
        });
    };

    const hatirlatmaSil = (id) => {
        axios.delete(`http://localhost:8000/hatirlatmalar/${id}`)
            .then(() => hatirlatmalariGetir());
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">⏰ Hatırlatmalar</h2>
            <p className="text-gray-400 mb-8">Hatırlatmalarını yönet.</p>

            {/* Hatırlatma Ekle */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Hatırlatma Ekle</h3>
                <div className="space-y-3">
                    <input
                        type="text"
                        value={metin}
                        onChange={e => setMetin(e.target.value)}
                        placeholder="Ne hatırlatayım?"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
                    />
                    <input
                        type="datetime-local"
                        value={tarih}
                        onChange={e => setTarih(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
                    />
                    <button
                        onClick={hatirlatmaEkle}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg transition"
                    >
                        Ekle
                    </button>
                </div>
            </div>

            {/* Hatırlatma Listesi */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Hatırlatmalar ({hatirlatmalar.length})
                </h3>
                <div className="space-y-2">
                    {hatirlatmalar.length === 0 && (
                        <p className="text-gray-500">Henüz hatırlatma eklenmemiş.</p>
                    )}
                    {hatirlatmalar.map((h) => (
                        <div key={h.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                            <div>
                                <p className="text-white">{h.metin}</p>
                                <p className="text-yellow-400 text-sm">{h.tarih_saat}</p>
                            </div>
                            <button
                                onClick={() => hatirlatmaSil(h.id)}
                                className="text-red-400 hover:text-red-300 transition ml-4"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Hatirlatmalar;