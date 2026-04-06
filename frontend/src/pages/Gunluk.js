import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../api";

function Gunluk() {
    const [gunlukler, setGunlukler] = useState([]);
    const [metin, setMetin] = useState("");

    useEffect(() => {
        gunlukleriGetir();
    }, []);

    const gunlukleriGetir = () => {
        axios.get(`${API_BASE}/gunluk`)
            .then(r => setGunlukler(r.data))
            .catch(e => console.error(e));
    };

    const gunlukEkle = () => {
        if (!metin.trim()) return;
        axios.post(`${API_BASE}/gunluk`, { metin })
            .then(() => {
                setMetin("");
                gunlukleriGetir();
            });
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">📖 Günlük</h2>
            <p className="text-gray-400 mb-8">Günlük notlarını yaz ve görüntüle.</p>

            {/* Günlük Yaz */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Bugünkü Notun</h3>
                <textarea
                    value={metin}
                    onChange={e => setMetin(e.target.value)}
                    placeholder="Bugün neler oldu?"
                    rows={5}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                />
                <button
                    onClick={gunlukEkle}
                    className="mt-3 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition"
                >
                    Kaydet
                </button>
            </div>

            {/* Günlük Listesi */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Geçmiş Notlar ({gunlukler.length})
                </h3>
                <div className="space-y-3">
                    {gunlukler.length === 0 && (
                        <p className="text-gray-500">Henüz not eklenmemiş.</p>
                    )}
                    {gunlukler.map((g) => (
                        <div key={g.id} className="bg-gray-800 rounded-lg px-4 py-4">
                            <p className="text-green-400 text-sm mb-2">📅 {g.tarih}</p>
                            <p className="text-white">{g.metin}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Gunluk;