const menuItems = [
    { id: "dashboard", label: "Ana Sayfa", iconClass: "fas fa-home" },
    { id: "kitaplar", label: "Kitaplar", iconClass: "fas fa-book" },
    { id: "filmler", label: "Filmler", iconClass: "fas fa-film" },
    { id: "hatirlatmalar", label: "Hatırlatmalar", iconClass: "fas fa-clock" },
    { id: "gunluk", label: "Günlük", iconClass: "fas fa-book-open" },
    { id: "dosyalar", label: "Dosyalar", iconClass: "fas fa-folder-open" },
];

function normalize(s) {
    return s.toLocaleLowerCase("tr-TR");
}

function Sidebar({ aktif, setAktif, collapsed, filterText = "" }) {
    const q = normalize(filterText.trim());
    const filtered = q
        ? menuItems.filter(
              (item) =>
                  normalize(item.label).includes(q) ||
                  normalize(item.id).includes(q)
          )
        : menuItems;

    return (
        <aside className={`elion-sidebar ${collapsed ? "elion-sidebar--collapsed" : ""}`}>
            <div className="elion-logo-row">
                <i className="fas fa-bolt elion-logo-icon" aria-hidden />
                {!collapsed && (
                    <div className="elion-logo-text">
                        <h1>ELION</h1>
                        <span>Kişisel Asistan</span>
                    </div>
                )}
            </div>

            {!collapsed && filterText && filtered.length === 0 && (
                <p className="elion-sidebar-hint">Sonuç yok — üstteki aramayı değiştir.</p>
            )}

            <ul className="elion-nav">
                {filtered.map((item) => (
                    <li key={item.id}>
                        <button
                            type="button"
                            title={collapsed ? item.label : undefined}
                            className={`elion-nav-btn ${aktif === item.id ? "active" : ""} ${
                                collapsed ? "elion-nav-btn--collapsed" : ""
                            }`}
                            onClick={() => setAktif(item.id)}
                        >
                            <i className={item.iconClass} aria-hidden />
                            {!collapsed && <span className="elion-nav-label">{item.label}</span>}
                        </button>
                    </li>
                ))}
            </ul>

            <div className="elion-sidebar-footer">
                <button
                    type="button"
                    title={collapsed ? "WhatsApp" : undefined}
                    className={`elion-wa-cta ${aktif === "whatsapp" ? "elion-wa-cta--active" : ""} ${
                        collapsed ? "elion-wa-cta--collapsed" : ""
                    }`}
                    onClick={() => setAktif("whatsapp")}
                >
                    <i className="fa-brands fa-whatsapp" aria-hidden />
                    {!collapsed && <span>WhatsApp</span>}
                </button>
                <button type="button" className="elion-sidebar-lock" title="Kilit" aria-label="Kilit">
                    <i className="fas fa-lock" aria-hidden />
                </button>
                {!collapsed && <div className="elion-version">v3.0 Pro AI</div>}
            </div>
        </aside>
    );
}

export default Sidebar;
