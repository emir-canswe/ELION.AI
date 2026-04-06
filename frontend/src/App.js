import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Kitaplar from "./pages/Kitaplar";
import Filmler from "./pages/Filmler";
import Hatirlatmalar from "./pages/Hatirlatmalar";
import Gunluk from "./pages/Gunluk";
import Dosyalar from "./pages/Dosyalar";
import Whatsapp from "./pages/Whatsapp";

const COLLAPSE_KEY = "elion_sidebar_collapsed";

function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return sessionStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [navFilter, setNavFilter] = useState("");

  useEffect(() => {
    try {
      sessionStorage.setItem(COLLAPSE_KEY, sidebarCollapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const sayfaGoster = () => {
    switch (aktifSayfa) {
      case "dashboard":
        return <Dashboard />;
      case "kitaplar":
        return <Kitaplar />;
      case "filmler":
        return <Filmler />;
      case "hatirlatmalar":
        return <Hatirlatmalar />;
      case "gunluk":
        return <Gunluk />;
      case "dosyalar":
        return <Dosyalar />;
      case "whatsapp":
        return <Whatsapp />;
      default:
        return <Dashboard />;
    }
  };

  const mainClass =
    aktifSayfa === "dashboard"
      ? "elion-main elion-main--dashboard"
      : "elion-main elion-main--page";

  return (
    <div className="elion-app">
      <Sidebar
        aktif={aktifSayfa}
        setAktif={setAktifSayfa}
        collapsed={sidebarCollapsed}
        filterText={navFilter}
      />
      <div className="elion-workspace">
        <TopBar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
          filterText={navFilter}
          onFilterChange={setNavFilter}
        />
        <main className={mainClass}>{sayfaGoster()}</main>
      </div>
    </div>
  );
}

export default App;
