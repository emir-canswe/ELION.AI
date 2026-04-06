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
        axios
            .get(`${API_BASE}/gunluk`)
            .then((r) => setGunlukler(r.data))
            .catch((e) => console.error(e));
    };

    const gunlukEkle = () => {
        if (!metin.trim()) return;
        axios.post(`${API_BASE}/gunluk`, { metin }).then(() => {
            setMetin("");
            gunlukleriGetir();
        });
    };

    return (
        <div className="elion-page">
            <h2 className="elion-page-title">Günlük</h2>
            <p className="elion-lead">Günlük notlarını yaz ve görüntüle.</p>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Bugünkü not</h3>
                <textarea
                    className="elion-textarea"
                    rows={5}
                    value={metin}
                    onChange={(e) => setMetin(e.target.value)}
                    placeholder="Bugün neler oldu?"
                />
                <button type="button" className="elion-btn" style={{ marginTop: "0.75rem" }} onClick={gunlukEkle}>
                    Kaydet
                </button>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Geçmiş ({gunlukler.length})</h3>
                {gunlukler.length === 0 && <p className="elion-muted">Henüz not yok.</p>}
                {gunlukler.map((g) => (
                    <div key={g.id} className="elion-list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
                        <p style={{ color: "#7dffc4", fontSize: "0.82rem", margin: 0 }}>{g.tarih}</p>
                        <p style={{ color: "var(--text-main)", margin: "0.35rem 0 0" }}>{g.metin}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Gunluk;
