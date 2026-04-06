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
        axios
            .get(`${API_BASE}/dosyalar`)
            .then((r) => {
                setDizinler(r.data.dizinler.map((d) => ({ ad: d, yol: d })));
                setDosyalar([]);
                setMevcutYol("Bilgisayarım");
            })
            .finally(() => setYukluyor(false));
    };

    const dizinAc = (yol) => {
        setYukluyor(true);
        axios
            .post(`${API_BASE}/dosyalar`, { yol })
            .then((r) => {
                setDizinler(r.data.dizinler);
                setDosyalar(r.data.dosyalar);
                setMevcutYol(yol);
            })
            .catch((e) => alert("Erişim engellendi veya hata: " + e.message))
            .finally(() => setYukluyor(false));
    };

    const dosyaAc = (yol) => {
        axios
            .post(`${API_BASE}/dosya-ac`, { yol })
            .then(() => alert("Dosya açıldı!"))
            .catch((e) => alert("Hata: " + e.message));
    };

    return (
        <div className="elion-page">
            <h2 className="elion-page-title">Dosyalar</h2>
            <p className="elion-lead">Bilgisayarındaki dosyalara göz at ve aç.</p>

            <div className="elion-card flex-gap" style={{ alignItems: "center" }}>
                <button type="button" className="elion-btn elion-btn--muted" onClick={kokDizinleriGetir}>
                    Bilgisayarım
                </button>
                {mevcutYol && <span className="elion-muted">📍 {mevcutYol}</span>}
                {yukluyor && <span style={{ color: "#e0c46c", fontSize: "0.85rem" }}>Yükleniyor…</span>}
            </div>

            <div className="elion-card">
                {dizinler.length === 0 && dosyalar.length === 0 && (
                    <p className="elion-muted">&quot;Bilgisayarım&quot; ile başla.</p>
                )}

                {dizinler.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                        <p className="elion-muted" style={{ marginBottom: "0.5rem" }}>
                            Klasörler ({dizinler.length})
                        </p>
                        <div className="grid-files">
                            {dizinler.map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="elion-btn elion-btn--muted"
                                    style={{ justifyContent: "flex-start", textAlign: "left" }}
                                    onClick={() => dizinAc(d.yol)}
                                >
                                    📂 <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{d.ad}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {dosyalar.length > 0 && (
                    <div>
                        <p className="elion-muted" style={{ marginBottom: "0.5rem" }}>
                            Dosyalar ({dosyalar.length})
                        </p>
                        <div className="grid-files">
                            {dosyalar.map((d, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="elion-btn elion-btn--muted"
                                    style={{ justifyContent: "flex-start", textAlign: "left" }}
                                    onClick={() => dosyaAc(d.yol)}
                                >
                                    📄 <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{d.ad}</span>
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
