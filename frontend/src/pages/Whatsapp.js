import { useState } from "react";
import axios from "axios";

function Whatsapp() {
    const [numara, setNumara] = useState("");
    const [mesaj, setMesaj] = useState("");
    const [durum, setDurum] = useState(null);
    const [gonderiyor, setGonderiyor] = useState(false);

    const mesajGonder = () => {
        if (!numara.trim() || !mesaj.trim()) return;
        setGonderiyor(true);
        setDurum(null);
        axios.post("http://localhost:8000/whatsapp/mesaj-gonder", {
            numara,
            mesaj
        })
            .then(r => {
                setDurum({ basari: true, mesaj: r.data.mesaj || "Mesaj gönderildi ✅" });
                setMesaj("");
            })
            .catch(e => {
                setDurum({ basari: false, mesaj: "Hata: " + (e.response?.data?.detail || e.message) });
            })
            .finally(() => setGonderiyor(false));
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-2">💬 WhatsApp</h2>
            <p className="text-gray-400 mb-8">İstediğin kişiye WhatsApp mesajı gönder.</p>

            {/* Bilgi Kutusu */}
            <div className="bg-gray-900 border border-green-800 rounded-xl p-4 mb-6">
                <p className="text-green-400 text-sm">
                    📱 Numara formatı: <span className="font-mono">905xxxxxxxxx</span> (başında + olmadan, ülke kodu ile)
                </p>
                <p className="text-gray-400 text-sm mt-1">
                    Örnek: Türkiye için 90 ile başla → <span className="font-mono">905321234567</span>
                </p>
            </div>

            {/* Form */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Mesaj Gönder</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Telefon Numarası</label>
                        <input
                            type="text"
                            value={numara}
                            onChange={e => setNumara(e.target.value)}
                            placeholder="905321234567"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-sm mb-1 block">Mesaj</label>
                        <textarea
                            value={mesaj}
                            onChange={e => setMesaj(e.target.value)}
                            placeholder="Mesajını yaz..."
                            rows={5}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                        />
                    </div>

                    {durum && (
                        <div className={`rounded-lg px-4 py-3 ${durum.basari ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
                            {durum.mesaj}
                        </div>
                    )}

                    <button
                        onClick={mesajGonder}
                        disabled={gonderiyor}
                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold px-6 py-2 rounded-lg transition"
                    >
                        {gonderiyor ? "Gönderiliyor..." : "📤 Gönder"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Whatsapp;