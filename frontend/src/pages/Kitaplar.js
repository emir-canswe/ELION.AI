import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "../api";

function Kitaplar() {
    const [kitaplar, setKitaplar] = useState([]);
    const [yeniKitap, setYeniKitap] = useState("");
    const [oneri, setOneri] = useState(null);

    useEffect(() => {
        kitaplariGetir();
    }, []);

    const kitaplariGetir = () => {
        axios
            .get(`${API_BASE}/kitaplar`)
            .then((r) => setKitaplar(r.data))
            .catch((e) => console.error(e));
    };

    const kitapEkle = () => {
        if (!yeniKitap.trim()) return;
        axios.post(`${API_BASE}/kitaplar`, { ad: yeniKitap }).then(() => {
            setYeniKitap("");
            kitaplariGetir();
        });
    };

    const rastgeleOner = () => {
        axios
            .get(`${API_BASE}/kitaplar/rastgele`)
            .then((r) => setOneri(r.data))
            .catch(() => setOneri({ ad: "Kitap bulunamadı" }));
    };

    return (
        <div className="elion-page">
            <h2 className="elion-page-title">Kitaplar</h2>
            <p className="elion-lead">Kitap listeni yönet ve rastgele öneri al.</p>

            <div className="elion-card">
                <h3>Rastgele öneri</h3>
                {oneri && <p style={{ color: "var(--text-main)", fontSize: "1.15rem", marginBottom: "1rem" }}>{oneri.ad}</p>}
                <button type="button" className="elion-btn" onClick={rastgeleOner}>
                    Öneri al
                </button>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Kitap ekle</h3>
                <div className="flex-gap">
                    <input
                        type="text"
                        className="elion-input"
                        style={{ flex: 1, minWidth: "12rem" }}
                        value={yeniKitap}
                        onChange={(e) => setYeniKitap(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && kitapEkle()}
                        placeholder="Kitap adı..."
                    />
                    <button type="button" className="elion-btn" onClick={kitapEkle}>
                        Ekle
                    </button>
                </div>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Kitap listesi ({kitaplar.length})</h3>
                {kitaplar.length === 0 && <p className="elion-muted">Henüz kitap eklenmemiş.</p>}
                {kitaplar.map((k) => (
                    <div key={k.id} className="elion-list-item">
                        <span style={{ color: "var(--accent-glow)" }}>📖</span>
                        <span>{k.ad}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Kitaplar;
