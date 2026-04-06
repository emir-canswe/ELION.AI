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
        axios
            .get(`${API_BASE}/filmler`)
            .then((r) => setFilmler(r.data))
            .catch((e) => console.error(e));
    };

    const filmEkle = () => {
        if (!yeniFilm.trim()) return;
        axios.post(`${API_BASE}/filmler`, { ad: yeniFilm }).then(() => {
            setYeniFilm("");
            filmleriGetir();
        });
    };

    const rastgeleOner = () => {
        axios
            .get(`${API_BASE}/filmler/rastgele`)
            .then((r) => setOneri(r.data))
            .catch(() => setOneri({ ad: "Film bulunamadı" }));
    };

    return (
        <div className="elion-page">
            <h2 className="elion-page-title">Filmler</h2>
            <p className="elion-lead">Film listeni yönet ve rastgele öneri al.</p>

            <div className="elion-card">
                <h3>Rastgele öneri</h3>
                {oneri && (
                    <p style={{ color: "var(--text-main)", fontSize: "1.15rem", marginBottom: "1rem" }}>{oneri.ad}</p>
                )}
                <button type="button" className="elion-btn" onClick={rastgeleOner}>
                    Öneri al
                </button>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Film ekle</h3>
                <div className="flex-gap">
                    <input
                        type="text"
                        className="elion-input"
                        style={{ flex: 1, minWidth: "12rem" }}
                        value={yeniFilm}
                        onChange={(e) => setYeniFilm(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && filmEkle()}
                        placeholder="Film adı..."
                    />
                    <button type="button" className="elion-btn" onClick={filmEkle}>
                        Ekle
                    </button>
                </div>
            </div>

            <div className="elion-card">
                <h3 className="elion-card-title-neutral">Film listesi ({filmler.length})</h3>
                {filmler.length === 0 && <p className="elion-muted">Henüz film eklenmemiş.</p>}
                {filmler.map((f) => (
                    <div key={f.id} className="elion-list-item">
                        <span style={{ color: "var(--accent-dark)" }}>🎥</span>
                        <span>{f.ad}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Filmler;
