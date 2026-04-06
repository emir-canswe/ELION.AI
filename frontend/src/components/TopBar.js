import { useState, useEffect } from "react";

function TopBar({
    sidebarCollapsed,
    onToggleSidebar,
    filterText,
    onFilterChange,
    title = "AI Assistant",
}) {
    const [searchOpen, setSearchOpen] = useState(() => Boolean(filterText));

    useEffect(() => {
        if (filterText) setSearchOpen(true);
    }, [filterText]);

    return (
        <header className="elion-topbar elion-topbar--clean">
            <div className="elion-topbar-traffic" aria-hidden="true">
                <span className="elion-dot elion-dot--r" />
                <span className="elion-dot elion-dot--y" />
                <span className="elion-dot elion-dot--g" />
            </div>

            <div className="elion-topbar-left">
                <button
                    type="button"
                    className="elion-topbar-icon-btn"
                    onClick={onToggleSidebar}
                    title={sidebarCollapsed ? "Menüyü aç" : "Menüyü daralt"}
                    aria-label="Kenar çubuğu"
                >
                    <i className={`fas ${sidebarCollapsed ? "fa-indent" : "fa-outdent"}`} aria-hidden />
                </button>
                <nav className="elion-breadcrumb" aria-label="Konum">
                    <span>Ana Sayfa</span>
                    <span className="elion-breadcrumb__sep">/</span>
                    <strong>{title}</strong>
                </nav>
            </div>

            <div className={`elion-topbar-search-wrap ${searchOpen ? "elion-topbar-search-wrap--open" : ""}`}>
                {!searchOpen ? (
                    <button
                        type="button"
                        className="elion-topbar-search-trigger"
                        onClick={() => setSearchOpen(true)}
                        title="Menüde ara"
                        aria-expanded="false"
                    >
                        <i className="fas fa-search" aria-hidden />
                    </button>
                ) : (
                    <>
                        <i className="fas fa-search elion-topbar-search-ico" aria-hidden />
                        <input
                            type="search"
                            className="elion-topbar-search"
                            placeholder="Menüde ara…"
                            value={filterText}
                            onChange={(e) => onFilterChange(e.target.value)}
                            autoComplete="off"
                            autoFocus
                        />
                        <button
                            type="button"
                            className="elion-topbar-search-clear"
                            onClick={() => {
                                onFilterChange("");
                                setSearchOpen(false);
                            }}
                            aria-label="Aramayı kapat"
                        >
                            <i className="fas fa-times" aria-hidden />
                        </button>
                    </>
                )}
            </div>

            <div className="elion-topbar-right elion-topbar-right--minimal">
                <span className="elion-topbar-pill">
                    <i
                        className="fas fa-circle"
                        style={{ fontSize: "0.45rem", color: "#00f0ff" }}
                        aria-hidden
                    />
                    Çevrimiçi
                </span>
            </div>
        </header>
    );
}

export default TopBar;
