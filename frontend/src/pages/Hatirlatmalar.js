import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../api";

function Hatirlatmalar() {
    const [hatirlatmalar, setHatirlatmalar] = useState([]);
    const [metin, setMetin] = useState("");
    const [tarih, setTarih] = useState("");

    useEffect(() => {
        hatirlatmalariGetir();
    }, []);

    const hatirlatmalariGetir = () => {
        axios
            .get(`${API_BASE}/hatirlatmalar`)
            .then((r) => setHatirlatmalar(r.data))
            .catch((e) => console.error(e));
    };

    const hatirlatmaEkle = () => {
        if (!metin.trim() || !tarih) return;
        const tarihDuzenlenmis = tarih.replace("T", " ").slice(0, 16);
        axios
            .post(`${API_BASE}/hatirlatmalar`, {
                metin,
                tarih_saat: tarihDuzenlenmis,
            })
            .then(() => {
                setMetin("");
                setTarih("");
                hatirlatmalariGetir();
            });
    };

    const hatirlatmaSil = (id) => {
        axios.delete(`${API_BASE}/hatirlatmalar/${id}`).then(() => hatirlatmalariGetir());
    };

    return (
        <div className="elion-page">
            <h2 className="elion-page-title">Hatırlatmalar</h2>
            <p className="elion-lead">Hatırlatmalarını yönet.</p>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Hatırlatma ekle</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input
                        type="text"
                        className="elion-input"
                        value={metin}
                        onChange={(e) => setMetin(e.target.value)}
                        placeholder="Ne hatırlatayım?"
                    />
                    <input
                        type="datetime-local"
                        className="elion-input"
                        value={tarih}
                        onChange={(e) => setTarih(e.target.value)}
                    />
                    <button type="button" className="elion-btn" onClick={hatirlatmaEkle}>
                        Ekle
                    </button>
                </div>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Liste ({hatirlatmalar.length})</h3>
                {hatirlatmalar.length === 0 && <p className="elion-muted">Henüz hatırlatma yok.</p>}
                {hatirlatmalar.map((h) => (
                    <div
                        key={h.id}
                        className="elion-list-item"
                        style={{ justifyContent: "space-between" }}
                    >
                        <div>
                            <p style={{ color: "var(--text-main)", margin: 0 }}>{h.metin}</p>
                            <p style={{ color: "#e0c46c", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>{h.tarih_saat}</p>
                        </div>
                        <button
                            type="button"
                            className="elion-btn elion-btn--danger"
                            style={{ padding: "0.4rem 0.75rem" }}
                            onClick={() => hatirlatmaSil(h.id)}
                            aria-label="Sil"
                        >
                            🗑️
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Hatirlatmalar;
