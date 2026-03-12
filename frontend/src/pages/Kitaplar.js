import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:8000";

function Kitaplar() {
    const [kitaplar, setKitaplar] = useState([]);
    const [yeniKitap, setYeniKitap] = useState("");
    const [oneri, setOneri] = useState(null);

    useEffect(() => { kitaplariGetir(); }, []);

    const kitaplariGetir = () => {
        axios.get(`${API}/kitaplar`)
            .then(r => setKitaplar(r.data))
            .catch(e => console.error(e));
    };

    const kitapEkle = () => {
        if (!yeniKitap.trim()) return;
        axios.post(`${API}/kitaplar`, { ad: yeniKitap })
            .then(() => { setYeniKitap(""); kitaplariGetir(); });
    };

    const rastgeleOner = () => {
        axios.get(`${API}/kitaplar/rastgele`)
            .then(r => setOneri(r.data))
            .catch(() => setOneri({ ad: "Kitap bulunamadı" }));
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">📚 Kitaplar</h2>
            <p className="text-gray-400 mb-8">Kitap listeni yönet ve rastgele öneri al.</p>
            <div className="bg-gray-900 border border-cyan-800 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Rastgele Öneri</h3>
                {oneri && <p className="text-white text-xl mb-4">📖 {oneri.ad}</p>}
                <button onClick={rastgeleOner} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition">Öneri Al</button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Kitap Ekle</h3>
                <div className="flex gap-3">
                    <input type="text" value={yeniKitap} onChange={e => setYeniKitap(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && kitapEkle()}
                        placeholder="Kitap adı..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500" />
                    <button onClick={kitapEkle} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition">Ekle</button>
                </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Kitap Listesi ({kitaplar.length})</h3>
                <div className="space-y-2">
                    {kitaplar.length === 0 && <p className="text-gray-500">Henüz kitap eklenmemiş.</p>}
                    {kitaplar.map(k => (
                        <div key={k.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                            <span className="text-cyan-400">📖</span>
                            <span className="text-white">{k.ad}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Kitaplar;