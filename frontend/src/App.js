import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Kitaplar from "./pages/Kitaplar";
import Filmler from "./pages/Filmler";
import Hatirlatmalar from "./pages/Hatirlatmalar";
import Gunluk from "./pages/Gunluk";
import Dosyalar from "./pages/Dosyalar";
import Whatsapp from "./pages/Whatsapp";

function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");

  const sayfaGoster = () => {
    switch (aktifSayfa) {
      case "dashboard": return <Dashboard />;
      case "kitaplar": return <Kitaplar />;
      case "filmler": return <Filmler />;
      case "hatirlatmalar": return <Hatirlatmalar />;
      case "gunluk": return <Gunluk />;
      case "dosyalar": return <Dosyalar />;
      case "whatsapp": return <Whatsapp />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      <Sidebar aktif={aktifSayfa} setAktif={setAktifSayfa} />
      <main className="flex-1 overflow-auto p-6">
        {sayfaGoster()}
      </main>
    </div>
  );
}

export default App;