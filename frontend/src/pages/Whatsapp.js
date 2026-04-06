import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../api";

function Whatsapp() {
    const [numara, setNumara] = useState("");
    const [mesaj, setMesaj] = useState("");
    const [durum, setDurum] = useState(null);
    const [gonderiyor, setGonderiyor] = useState(false);

    const mesajGonder = () => {
        if (!numara.trim() || !mesaj.trim()) return;
        setGonderiyor(true);
        setDurum(null);
        axios
            .post(`${API_BASE}/whatsapp/mesaj-gonder`, {
                numara,
                mesaj,
            })
            .then((r) => {
                setDurum({ basari: true, mesaj: r.data.mesaj || "Mesaj gönderildi ✅" });
                setMesaj("");
            })
            .catch((e) => {
                setDurum({
                    basari: false,
                    mesaj: "Hata: " + (e.response?.data?.detail || e.message),
                });
            })
            .finally(() => setGonderiyor(false));
    };

    return (
        <div className="elion-page">
            <h2 className="elion-page-title">WhatsApp</h2>
            <p className="elion-lead">İstediğin kişiye WhatsApp mesajı gönder.</p>

            <div className="elion-card">
                <p style={{ color: "#7dffc4", fontSize: "0.88rem", margin: 0 }}>
                    Numara: <span style={{ fontFamily: "monospace" }}>905xxxxxxxxx</span> (+ olmadan, ülke kodu ile)
                </p>
                <p className="elion-muted" style={{ marginTop: "0.5rem", marginBottom: 0 }}>
                    Örnek: <span style={{ fontFamily: "monospace" }}>905321234567</span>
                </p>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Mesaj gönder</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label className="elion-muted" style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.82rem" }}>
                            Telefon
                        </label>
                        <input
                            type="text"
                            className="elion-input"
                            value={numara}
                            onChange={(e) => setNumara(e.target.value)}
                            placeholder="905321234567"
                        />
                    </div>
                    <div>
                        <label className="elion-muted" style={{ display: "block", marginBottom: "0.35rem", fontSize: "0.82rem" }}>
                            Mesaj
                        </label>
                        <textarea
                            className="elion-textarea"
                            rows={5}
                            value={mesaj}
                            onChange={(e) => setMesaj(e.target.value)}
                            placeholder="Mesajını yaz..."
                        />
                    </div>

                    {durum && (
                        <div className={durum.basari ? "elion-alert elion-alert--ok" : "elion-alert elion-alert--err"}>
                            {durum.mesaj}
                        </div>
                    )}

                    <button type="button" className="elion-btn" disabled={gonderiyor} onClick={mesajGonder}>
                        {gonderiyor ? "Gönderiliyor…" : "Gönder"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Whatsapp;
