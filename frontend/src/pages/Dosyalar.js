import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";

function Dosyalar() {
    const [mevcutYol, setMevcutYol] = useState("");
    const [dizinler, setDizinler] = useState([]);
    const [dosyalar, setDosyalar] = useState([]);
    const [yukluyor, setYukluyor] = useState(false);

    const kokDizinleriGetir = () => {
        setYukluyor(true);
        axios.get(`${API_BASE}/dosyalar`)
            .then(r => {
                setDizinler(r.data.dizinler.map(d => ({ ad: d, yol: d })));
                setDosyalar([]);
                setMevcutYol("Bilgisayarım");
            })
            .finally(() => setYukluyor(false));
    };

    const dizinAc = (yol) => {
        setYukluyor(true);
        axios.post(`${API_BASE}/dosyalar`, { yol })
            .then(r => {
                setDizinler(r.data.dizinler);
                setDosyalar(r.data.dosyalar);
                setMevcutYol(yol);
            })
            .catch(e => alert("Erişim engellendi veya hata: " + e.message))
            .finally(() => setYukluyor(false));
    };

    const dosyaAc = (yol) => {
        axios.post(`${API_BASE}/dosya-ac`, { yol })
            .then(() => alert("Dosya açıldı!"))
            .catch(e => alert("Hata: " + e.message));
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">📁 Dosyalar</h2>
            <p className="text-gray-400 mb-8">Bilgisayarındaki dosyalara göz at ve aç.</p>

            {/* Araç Çubuğu */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 flex items-center gap-4">
                <button
                    onClick={kokDizinleriGetir}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                    🖥️ Bilgisayarım
                </button>
                {mevcutYol && (
                    <span className="text-gray-400 text-sm">📍 {mevcutYol}</span>
                )}
                {yukluyor && <span className="text-yellow-400 text-sm">Yükleniyor...</span>}
            </div>

            {/* İçerik */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                {dizinler.length === 0 && dosyalar.length === 0 && (
                    <p className="text-gray-500">"Bilgisayarım" butonuna tıkla.</p>
                )}

                {/* Klasörler */}
                {dizinler.length > 0 && (
                    <div className="mb-4">
                        <p className="text-gray-400 text-sm mb-2">📂 Klasörler ({dizinler.length})</p>
                        <div className="grid grid-cols-3 gap-2">
                            {dizinler.map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => dizinAc(d.yol)}
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-left transition"
                                >
                                    <span>📂</span>
                                    <span className="text-white text-sm truncate">{d.ad}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dosyalar */}
                {dosyalar.length > 0 && (
                    <div>
                        <p className="text-gray-400 text-sm mb-2">📄 Dosyalar ({dosyalar.length})</p>
                        <div className="grid grid-cols-3 gap-2">
                            {dosyalar.map((d, i) => (
                                <button
                                    key={i}
                                    onClick={() => dosyaAc(d.yol)}
                                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 text-left transition"
                                >
                                    <span>📄</span>
                                    <span className="text-white text-sm truncate">{d.ad}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dosyalar;