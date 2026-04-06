import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../api";

function Filmler() {
    const [filmler, setFilmler] = useState([]);
    const [yeniFilm, setYeniFilm] = useState("");
    const [oneri, setOneri] = useState(null);

    useEffect(() => {
        filmleriGetir();
    }, []);

    const filmleriGetir = () => {
        axios.get(`${API_BASE}/filmler`)
            .then(r => setFilmler(r.data))
            .catch(e => console.error(e));
    };

    const filmEkle = () => {
        if (!yeniFilm.trim()) return;
        axios.post(`${API_BASE}/filmler`, { ad: yeniFilm })
            .then(() => {
                setYeniFilm("");
                filmleriGetir();
            });
    };

    const rastgeleOner = () => {
        axios.get(`${API_BASE}/filmler/rastgele`)
            .then(r => setOneri(r.data))
            .catch(() => setOneri({ ad: "Film bulunamadı" }));
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">🎬 Filmler</h2>
            <p className="text-gray-400 mb-8">Film listeni yönet ve rastgele öneri al.</p>

            {/* Öneri */}
            <div className="bg-gray-900 border border-purple-800 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-purple-400 mb-4">Rastgele Öneri</h3>
                {oneri && (
                    <p className="text-white text-xl mb-4">🎥 {oneri.ad}</p>
                )}
                <button
                    onClick={rastgeleOner}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition"
                >
                    Öneri Al
                </button>
            </div>

            {/* Film Ekle */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Film Ekle</h3>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={yeniFilm}
                        onChange={e => setYeniFilm(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && filmEkle()}
                        placeholder="Film adı..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <button
                        onClick={filmEkle}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg transition"
                    >
                        Ekle
                    </button>
                </div>
            </div>

            {/* Film Listesi */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                    Film Listesi ({filmler.length})
                </h3>
                <div className="space-y-2">
                    {filmler.length === 0 && (
                        <p className="text-gray-500">Henüz film eklenmemiş.</p>
                    )}
                    {filmler.map((f) => (
                        <div key={f.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                            <span className="text-purple-400">🎥</span>
                            <span className="text-white">{f.ad}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Filmler;