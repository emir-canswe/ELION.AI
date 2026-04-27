import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Fuse from "fuse.js";
import { API_BASE } from "../api";
import AiAvatar from "../components/AiAvatar";

const KOMUTLAR = {
    selamlama: ["merhaba", "merhaba elion", "hey elion", "selam", "hey", "selam elion", "günaydın", "günaydın elion", "iyi günler", "iyi akşamlar"],
    nasilsin: ["nasılsın", "nasılsın elion", "ne haber", "keyifler nasıl", "nasıl gidiyor", "her şey yolunda mı", "iyi misin", "ne yapıyorsun", "eyw"],
    tesekkur: ["teşekkürler", "teşekkür ederim", "sağ ol", "eyvallah", "çok sağ ol", "süpersin", "harikasın"],
    ovme: ["iyi iş", "aferin", "bravo", "mükemmelsin", "çok iyisin", "beğendim seni"],
    sikayet: ["berbat iş", "kötü iş", "beğenmedim", "yetersizsin"],
    hava: ["hava nasıl", "bugün hava", "hava durumu"],
    saat: ["saat kaç", "kaç oldu", "saati söyle"],
    tarih: ["bugün ne", "tarih ne", "hangi gün"],
    kitap: ["kitap öner", "bana kitap öner", "kitap tavsiye et", "ne okusam", "okuyacak kitap"],
    film: ["film öner", "bana film öner", "film tavsiye et", "ne izlesem", "izleyecek film", "film önerisi"],
    hatirlatma: ["hatırlatma ekle", "hatırlat", "bana hatırlatma kur", "unutmayayım", "alarm kur"],
    gunluk: ["günlük yaz", "günlüğe not ekle", "günlük", "not al", "bunu not et"],
    youtube: ["youtube aç", "şarkı aç", "müzik aç", "youtube", "şarkı çal", "müzik çal", "video aç"],
    google: ["google aç", "internette ara", "google'da ara", "arama yap", "araştır", "bul"],
    dosya: ["dosyaları aç", "dosyalara bak", "bilgisayarı aç", "dosya gezgini", "klasör aç"],
    whatsapp: ["mesaj gönder", "whatsapp", "birine mesaj yaz", "mesaj at", "yaz"],
    durdur: ["dur", "kapat", "bitir", "görüşürüz", "hoşça kal", "bay bay", "kapatıyorum", "çıkış"],
    yardim: ["yardım et", "ne yapabilirsin", "komutlar neler", "neler yapabilirsin", "yardım"],
    sans: ["şansımı dene", "rastgele bir şey söyle", "beni şaşırt"],
    uygulama: ["uygulama aç", "hesap makinesi", "chrome aç", "uygulamayı aç", "not defteri"],
    sistem: ["bilgisayarı kapat", "bilgisayarı yeniden başlat", "ekranı kilitle", "bilgisayarı kilitle"],
    indirilenler: ["indirilenler", "indirilenleri aç", "indirilenlere gir", "indirmeler"],
    masaustu: ["masaüstü", "masaüstünü aç", "masaüstüne git"],
    belgeler: ["belgeler", "belgeleri aç", "belgelere gir"],
};

const turkceKarakterTemizle = (metin) => {
    return metin
        .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
        .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
        .replace(/[^a-z0-9\s]/g, "");
};

const tumKomutlar = Object.entries(KOMUTLAR).flatMap(([kategori, kelimeler]) =>
    kelimeler.map(kelime => ({ 
        kategori, 
        kelime,
        temizKelime: turkceKarakterTemizle(kelime.toLowerCase())
    }))
);

const fuse = new Fuse(tumKomutlar, {
    keys: ["temizKelime", "kelime"],
    includeScore: true,
    threshold: 0.5,
    ignoreLocation: true,
    distance: 100,
});

function komutBul(ses) {
    const temizSes = turkceKarakterTemizle(ses);
    
    // 1. Tam cümle araması
    let sonuc = fuse.search(temizSes);
    if (sonuc.length > 0 && sonuc[0].score <= 0.4) {
        return sonuc[0].item.kategori;
    }

    // 2. Parçalı arama (1 ve 2 kelimelik bloklar ile cümle içinden yakalama)
    const kelimeler = temizSes.split(" ").filter(k => k.trim().length > 0);
    let enIyiKategori = null;
    let enIyiSkor = 1;

    for (let i = 0; i < kelimeler.length; i++) {
        // İkili kelime eşleşmesi (Örn: "filmm oner")
        if (i < kelimeler.length - 1) {
            let res2 = fuse.search(kelimeler[i] + " " + kelimeler[i + 1]);
            if (res2.length > 0 && res2[0].score < enIyiSkor) {
                enIyiSkor = res2[0].score;
                enIyiKategori = res2[0].item.kategori;
            }
        }
        // Tek kelime eşleşmesi (Örn: "whatsapp")
        let res1 = fuse.search(kelimeler[i]);
        if (res1.length > 0 && res1[0].score < enIyiSkor) {
            enIyiSkor = res1[0].score;
            enIyiKategori = res1[0].item.kategori;
        }
    }

    // 0.45 altı skorları (düşük skor = yüksek benzerlik) kabul et
    if (enIyiKategori && enIyiSkor <= 0.45) {
        return enIyiKategori;
    }

    return null;
}

const rastgele = (arr) => arr[Math.floor(Math.random() * arr.length)];

function konusmaSentezi(metin) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(metin);
    utterance.lang = "tr-TR";
    utterance.rate = 0.95;
    utterance.pitch = 0.8;
    const sesler = window.speechSynthesis.getVoices();
    const turkce = sesler.find(s => s.lang === "tr-TR" && s.name.toLowerCase().includes("male"))
        || sesler.find(s => s.lang === "tr-TR")
        || sesler[0];
    if (turkce) utterance.voice = turkce;
    window.speechSynthesis.speak(utterance);
}

export default function Dashboard() {
    const [baslatildi, setBaslatildi] = useState(false);
    const [dinliyor, setDinliyor] = useState(false);
    const [durum, setDurum] = useState("Elion hazır. Mikrofona bas ve konuş.");
    const [loglar, setLoglar] = useState([]);
    const [mod, setMod] = useState(null);
    const [altAdim, setAltAdim] = useState(null);
    const [geciciVeri, setGeciciVeri] = useState({});
    const [yazilan, setYazilan] = useState("");
    const [komutlarAcik, setKomutlarAcik] = useState(false);
    const recognitionRef = useRef(null);
    const logSonuRef = useRef(null);
    const dinliyorRef = useRef(false);

    useEffect(() => {
        dinliyorRef.current = dinliyor;
    }, [dinliyor]);

    useEffect(() => {
        logSonuRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [loglar]);

    // Uygulama açıldığında geçmiş sohbetleri yükle
    useEffect(() => {
        axios.get(`${API_BASE}/sohbet`).then(res => {
            if (res.data && res.data.length > 0) {
                setLoglar(res.data);
            }
        }).catch(err => console.log("Sohbet yüklenemedi", err));
    }, []);

    const logEkle = (kimden, mesaj) => {
        const zaman = new Date().toLocaleTimeString();
        setLoglar(prev => [...prev, { kimden, mesaj, zaman }]);
        axios.post(`${API_BASE}/sohbet`, { kimden, mesaj }).catch(e => console.log("Sohbet kaydedilemedi"));
    };

    const elioniBaslat = () => {
        setBaslatildi(true);
        setTimeout(() => {
            konusmaSentezi("Hoş geldin efendim. Elion aktif, sizi dinliyorum.");
            logEkle("🤖 Elion", "Hoş geldin efendim! Sizi dinliyorum.");
        }, 500);
    };

    const komutIsle = async (ses) => {
        logEkle("🎤 Sen", ses);

        if (mod === "hatirlatma") { await hatirlatmaAdim(ses); return; }
        if (mod === "whatsapp") { await whatsappAdim(ses); return; }
        if (mod === "gunluk") { await gunlukAdim(ses); return; }
        if (mod === "dosya") { await dosyaAdim(ses); return; }
        if (mod === "uygulama") { await uygulamaAdim(ses); return; }
        if (mod === "sistem") { await sistemAdim(ses); return; }
        if (mod === "film_onayi") {
            if (ses.includes("evet") || ses.includes("aç")) {
                const url = "https://www.google.com/search?q=" + geciciVeri.filmAd.replace(/ /g, "+") + "+izle";
                window.open(url, "_blank");
                konusmaSentezi(`${geciciVeri.filmAd} aranıyor efendim.`);
                logEkle("🤖 Elion", `${geciciVeri.filmAd} tarayıcıda açılıyor.`);
            } else {
                const cevap = rastgele(["Tamam efendim, başka bir şey ister misiniz?", "Anlaşıldı efendim, ne yapmamı istersiniz?", "İptal ettim efendim, başka bir komut?"]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            }
            setMod(null); setGeciciVeri({}); return;
        }
        if (mod === "youtube") {
            const url = "https://www.youtube.com/results?search_query=" + ses.replace(/ /g, "+");
            window.open(url, "_blank");
            konusmaSentezi(`${ses} için YouTube'da arama yapıyorum.`);
            logEkle("🤖 Elion", `YouTube'da açılıyor: ${ses}`);
            setMod(null); return;
        }
        if (mod === "google") {
            const url = "https://www.google.com/search?q=" + ses.replace(/ /g, "+");
            window.open(url, "_blank");
            konusmaSentezi(`${ses} için Google'da arama yapıyorum.`);
            logEkle("🤖 Elion", `Google'da aranıyor: ${ses}`);
            setMod(null); return;
        }

        // Önce tam eşleşme kontrol et, sonra fuzzy
        const kategori =
            KOMUTLAR.selamlama.some(k => ses.includes(k)) ? "selamlama" :
                KOMUTLAR.nasilsin.some(k => ses.includes(k)) ? "nasilsin" :
                    KOMUTLAR.tesekkur.some(k => ses.includes(k)) ? "tesekkur" :
                        KOMUTLAR.ovme.some(k => ses.includes(k)) ? "ovme" :
                            KOMUTLAR.sikayet.some(k => ses.includes(k)) ? "sikayet" :
                                KOMUTLAR.saat.some(k => ses.includes(k)) ? "saat" :
                                    KOMUTLAR.tarih.some(k => ses.includes(k)) ? "tarih" :
                                        KOMUTLAR.hava.some(k => ses.includes(k)) ? "hava" :
                                            KOMUTLAR.yardim.some(k => ses.includes(k)) ? "yardim" :
                                                KOMUTLAR.sans.some(k => ses.includes(k)) ? "sans" :
                                                    KOMUTLAR.kitap.some(k => ses.includes(k)) ? "kitap" :
                                                        KOMUTLAR.film.some(k => ses.includes(k)) ? "film" :
                                                            KOMUTLAR.youtube.some(k => ses.includes(k)) ? "youtube" :
                                                                KOMUTLAR.google.some(k => ses.includes(k)) ? "google" :
                                                                    KOMUTLAR.hatirlatma.some(k => ses.includes(k)) ? "hatirlatma" :
                                                                        KOMUTLAR.whatsapp.some(k => ses.includes(k)) ? "whatsapp" :
                                                                            KOMUTLAR.gunluk.some(k => ses.includes(k)) ? "gunluk" :
                                                                                KOMUTLAR.dosya.some(k => ses.includes(k)) ? "dosya" :
                                                                                    KOMUTLAR.indirilenler.some(k => ses.includes(k)) ? "indirilenler" :
                                                                                        KOMUTLAR.masaustu.some(k => ses.includes(k)) ? "masaustu" :
                                                                                            KOMUTLAR.belgeler.some(k => ses.includes(k)) ? "belgeler" :
                                                                                                KOMUTLAR.uygulama.some(k => ses.includes(k)) ? "uygulama" :
                                                                                                    KOMUTLAR.sistem.some(k => ses.includes(k)) ? "sistem" :
                                                                                                        KOMUTLAR.durdur.some(k => ses.includes(k)) ? "durdur" :
                                                                                                            komutBul(ses); // Tam eşleşme yoksa fuzzy dene

        if (kategori === "selamlama") {
            const cevap = rastgele([
                "Merhaba efendim! Sizi görmek ne güzel, nasıl yardımcı olabilirim?",
                "Hoş geldiniz efendim! Elion her zaman hizmetinizde, buyrun!",
                "Merhaba! Bugün ne yapmamı istersiniz efendim?",
                "Selam efendim! Hazır ve nazır bekliyordum sizi!",
                "Merhaba merhaba! Bugün harika bir gün olacak, ne yapıyoruz?",
                "Hoş geldiniz! Sizi görmek her zaman güzel efendim.",
                "Hey efendim! Tam zamanında geldiniz, hazırım!",
                "Merhaba efendim, bugün size nasıl yardımcı olabilirim?",
                "Selam! Emriniz nedir efendim?",
                "Günaydın efendim! Bugün için planlarınız neler?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "nasilsin") {
            const cevap = rastgele([
                "İyiyim efendim, teşekkürler! Bugün size nasıl yardımcı olabilirim?",
                "Gayet iyiyim efendim! Sizi görmek güzel oldu, ne yapabilirim?",
                "Mükemmelim efendim! Her zaman hizmetinizdeyim, buyrun ne istersiniz?",
                "Çok iyiyim efendim, sağ olun! Siz nasılsınız?",
                "Harikayım efendim! Bugün enerjim yerinde, ne yapalım?",
                "İyiyim efendim ama sizi görünce daha da iyi oldum!",
                "Süper hissediyorum efendim! Hazırım, buyrun!",
                "Teşekkürler efendim, gayet güzelim! Ne yapabilirim sizin için?",
                "İyiyim, her zamanki gibi hizmetinizdeyim efendim!",
                "Çok şükür iyiyim efendim! Umarım siz de iyisinizdir."
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "tesekkur") {
            const cevap = rastgele([
                "Rica ederim efendim!",
                "Her zaman efendim!",
                "Ne demek efendim, yardımcı olabildiysem ne mutlu!",
                "Estağfurullah efendim, bu benim görevim!",
                "Teşekkür etmeyin efendim, sizin için buradayım!",
                "Ne demek efendim, her zaman emrinizdeyim!",
                "Seve seve efendim, başka bir isteğiniz var mı?",
                "Rica ederim! Başka bir şey yapabilir miyim?",
                "Bir şey değil efendim, her zaman yardımcı olmak isterim!",
                "Yardımcı olabildiğime sevindim efendim!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "ovme") {
            const cevap = rastgele([
                "Teşekkürler efendim, bu beni mutlu etti!",
                "Çok naziksiniz efendim!",
                "Elimden gelenin en iyisini yapmaya çalışıyorum!",
                "Bu sözler beni çok motive etti efendim!",
                "Vay be, teşekkür ederim efendim! Daha iyisini yapacağım!",
                "Siz söyleyince çok anlamlı oldu efendim!",
                "Çok teşekkürler! Sizin için her zaman en iyisini yaparım!",
                "Aferin demek güzel efendim, devam edeceğim!",
                "Bu iltifat için teşekkürler, çok mutlu oldum!",
                "Harika hissettirdiniz beni efendim, sağ olun!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "sikayet") {
            const cevap = rastgele([
                "Özür dilerim efendim, daha iyi olmaya çalışacağım!",
                "Haklısınız efendim, kendimi geliştireceğim!",
                "Üzgünüm efendim, bir daha deneyelim mi?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "saat") {
            const saat = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
            const cevap = rastgele([
                `Saat şu an ${saat} efendim.`,
                `Saate baktım efendim, ${saat} gösteriyor.`,
                `Tam olarak ${saat} efendim.`
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "tarih") {
            const tarih = new Date().toLocaleDateString("tr-TR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            const cevap = rastgele([
                `Bugün ${tarih} efendim.`,
                `Takvime baktım, ${tarih} efendim.`,
                `${tarih}, bugün bu tarih efendim.`
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "hava") {
            const cevap = rastgele([
                "Hava durumu için konumunuza erişimim yok efendim, tarayıcıdan kontrol edebilirsiniz.",
                "Maalesef hava durumuna bakamıyorum efendim, bir hava sitesi açayım mı?",
                "Hava bilgim yok efendim ama Google'da aratmamı ister misiniz?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "yardim") {
            const cevap = rastgele([
                "Size film, kitap önerebilir, hatırlatma ekleyebilir, günlük yazabilir, YouTube ve Google açabilirim!",
                "Komutlarım: film öner, kitap öner, hatırlatma ekle, günlük yaz, YouTube aç, mesaj gönder!",
                "Birçok şey yapabilirim efendim! Film, kitap, hatırlatma, günlük, YouTube, Google ve WhatsApp!",
                "Yardımcı olmaktan memnuniyet duyarım efendim! Ne isterseniz söyleyin.",
                "Hizmetinizdeyim! Film önerisi, kitap tavsiyesi, mesaj gönderme ve daha fazlası!",
                "Size çok şey yapabilirim efendim, sadece söyleyin!",
                "Film, kitap, hatırlatma ve daha fazlasında yardımcı olabilirim!",
                "Ne isterseniz söyleyin efendim, elimden geleni yaparım!",
                "Yardım etmek için buradayım! Denemek istediğiniz bir komut var mı?",
                "Asistanınız olarak her an hizmetinizdeyim efendim!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "sans") {
            const cevap = rastgele([
                "Bugün harika bir gün olacak efendim, inanın bana!",
                "Bir fincan kahve içmeyi düşünüyor musunuz? Çok iyi gelir!",
                "Hayat güzel efendim, gülümseyin!",
                "Bugün sürprizler sizi bekliyor olabilir efendim!",
                "Pozitif düşünün efendim, her şey yoluna girecek!",
                "Bugün kendinize iyi bakın efendim, bunu hak ediyorsunuz!",
                "Şansınız açık görünüyor efendim, deneyin bir şeyler!",
                "Bugün güzel haberler gelebilir efendim, hazır olun!",
                "Gülümsemek bedava efendim, deneyin!",
                "Hayatın tadını çıkarın efendim, her an güzel!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

        } else if (kategori === "kitap") {
            try {
                const r = await axios.get(`${API_BASE}/kitaplar/rastgele`);
                const cevap = rastgele([
                    `Size önerim: ${r.data.ad}. Harika bir kitap efendim!`,
                    `${r.data.ad} okuyabilirsiniz efendim, çok beğenebilirsiniz!`,
                    `Bugün için önerim: ${r.data.ad} efendim. Keyifli okumalar!`,
                    `${r.data.ad} kitabına ne dersiniz efendim?`
                ]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            } catch {
                konusmaSentezi("Kitap bulunamadı efendim, listeye kitap ekleyin.");
                logEkle("🤖 Elion", "Kitap bulunamadı.");
            }

        } else if (kategori === "film") {
            try {
                const r = await axios.get(`${API_BASE}/filmler/rastgele`);
                const cevap = `Size önerim: ${r.data.ad}. İzlemek ister misiniz? Evet deyin.`;
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
                setGeciciVeri(v => ({ ...v, filmAd: r.data.ad }));
                setMod("film_onayi");
            } catch {
                konusmaSentezi("Film bulunamadı efendim, listeye film ekleyin.");
                logEkle("🤖 Elion", "Film bulunamadı.");
            }

        } else if (kategori === "youtube") {
            const cevap = rastgele([
                "Hangi şarkıyı açmamı istersiniz efendim?",
                "YouTube için ne arayayım efendim?",
                "Söyleyin efendim, hemen YouTube'da açıyorum!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setMod("youtube");

        } else if (kategori === "google") {
            const cevap = rastgele([
                "Ne aramamı istersiniz efendim?",
                "Google'da ne arayalım efendim?",
                "Söyleyin efendim, hemen Google'da bakıyorum!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setMod("google");

        } else if (kategori === "hatirlatma") {
            const cevap = rastgele([
                "Ne hatırlatmamı istersiniz efendim?",
                "Tabii efendim, ne için hatırlatma kurayım?",
                "Hatırlatma kuruyorum, ne hatırlatayım efendim?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setMod("hatirlatma"); setAltAdim("metin");

        } else if (kategori === "whatsapp") {
            const cevap = rastgele([
                "Kimin numarasına mesaj göndereyim efendim?",
                "Tabii efendim, numarayı söyleyin göndereyim.",
                "WhatsApp mesajı için numarayı bekliyorum efendim."
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setMod("whatsapp"); setAltAdim("numara");

        } else if (kategori === "gunluk") {
            const cevap = rastgele([
                "Günlüğünüzü dinliyorum efendim, buyrun.",
                "Sizi dinliyorum efendim, günlüğünüzü yazın.",
                "Hazırım efendim, ne yazmamı istersiniz günlüğe?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setMod("gunluk");

        } else if (kategori === "dosya") {
            const cevap = rastgele([
                "Hangi dizini veya klasörü açmamı istersiniz efendim?",
                "Tabii efendim, bilgisayardaki hangi konumu açayım?",
                "Söyleyin efendim, hangi sürücüye veya klasöre girelim?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setMod("dosya");

        } else if (kategori === "indirilenler") {
            try {
                await axios.post(`${API_BASE}/dosya-ac`, { yol: "downloads" });
                const cevap = rastgele(["İndirilenler klasörünü açtım efendim.", "Hemen indirilenleri açıyorum.", "İndirilenler klasörü karşınızda efendim."]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            } catch {
                konusmaSentezi("Klasörü açarken bir hata oluştu efendim."); logEkle("🤖 Elion", "Hata: Klasör açılamadı.");
            }

        } else if (kategori === "masaustu") {
            try {
                await axios.post(`${API_BASE}/dosya-ac`, { yol: "desktop" });
                const cevap = rastgele(["Masaüstü klasörünü açtım efendim.", "Hemen masaüstünü açıyorum.", "Masaüstü klasörü karşınızda efendim."]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            } catch {
                konusmaSentezi("Klasörü açarken bir hata oluştu efendim."); logEkle("🤖 Elion", "Hata: Klasör açılamadı.");
            }

        } else if (kategori === "belgeler") {
            try {
                await axios.post(`${API_BASE}/dosya-ac`, { yol: "documents" });
                const cevap = rastgele(["Belgeler klasörünü açtım efendim.", "Hemen belgeleri açıyorum.", "Belgeler klasörü karşınızda efendim."]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            } catch {
                konusmaSentezi("Klasörü açarken bir hata oluştu efendim."); logEkle("🤖 Elion", "Hata: Klasör açılamadı.");
            }

        } else if (kategori === "uygulama") {
            if (ses.includes("hesap") || ses.includes("chrome") || ses.includes("not defteri")) {
                uygulamaAdim(ses);
            } else {
                const cevap = rastgele(["Hangi uygulamayı açmamı istersiniz efendim?", "Tabii, hangi programı çalıştırayım?"]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
                setMod("uygulama");
            }

        } else if (kategori === "sistem") {
            if (ses.includes("kapat") || ses.includes("kilitle") || ses.includes("yeniden")) {
                sistemAdim(ses);
            } else {
                const cevap = rastgele(["Sistem komutu algılandı. Ne yapmamı istersiniz efendim?", "Sistem kontrolü devrede. Ne istersiniz?"]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
                setMod("sistem");
            }

        } else if (kategori === "durdur") {
            const cevap = rastgele([
                "Görüşürüz efendim, kendinize iyi bakın!",
                "Hoşça kalın efendim, dilediğinizde buradayım!",
                "İyi günler efendim, görüşmek üzere!",
                "Kalın sağlıcakla efendim!",
                "Bay bay efendim, sizi bekliyorum!"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setDinliyor(false);

        } else {
            const cevap = rastgele([
                "Anlayamadım efendim, biraz daha açıklar mısınız?",
                "Özür dilerim efendim, tam anlayamadım. Tekrar söyler misiniz?",
                "Bunu tam kavrayamadım efendim, farklı söyler misiniz?",
                "Pardon efendim, sizi net duyamadım. Bir daha söyler misiniz?",
                "Hmm, bu komutu çözemedim efendim. Yardım için 'yardım' diyebilirsiniz.",
                "Kusura bakmayın efendim, anlayamadım. Tekrar eder misiniz?",
                "Sizi duydum ama anlayamadım efendim, netleştirir misiniz?",
                "Bir daha alır mısınız efendim, tam kavrayamadım?",
                "Özür dilerim efendim, net bir komut anlayamadım.",
                "Bu isteği yerine getiremedim efendim, belki farklı söyleyebilirsiniz?"
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
        }
    };

    const hatirlatmaAdim = async (ses) => {
        if (altAdim === "metin") {
            setGeciciVeri(v => ({ ...v, metin: ses }));
            const cevap = "Ne zaman hatırlatayım? Örnek: 2026-03-15 14:30";
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setAltAdim("tarih");
        } else if (altAdim === "tarih") {
            try {
                await axios.post(`${API_BASE}/hatirlatmalar`, { metin: geciciVeri.metin, tarih_saat: ses });
                const cevap = rastgele(["Hatırlatma kaydedildi efendim!", "Tamam efendim, hatırlatmayı kurdum!", "Kaydettim efendim, sizi hatırlatırım!"]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            } catch {
                konusmaSentezi("Tarih formatı hatalı efendim. Örnek: 2026-03-15 14:30");
                logEkle("🤖 Elion", "Hata: Tarih formatı hatalı.");
            }
            setMod(null); setAltAdim(null); setGeciciVeri({});
        }
    };

    const whatsappAdim = async (ses) => {
        if (altAdim === "numara") {
            setGeciciVeri(v => ({ ...v, numara: ses.replace(/ /g, "") }));
            const cevap = rastgele(["Mesajınızı söyleyin efendim.", "Dinliyorum efendim, mesajınız nedir?", "Buyrun efendim, mesajı söyleyin."]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            setAltAdim("mesaj");
        } else if (altAdim === "mesaj") {
            try {
                await axios.post(`${API_BASE}/whatsapp/mesaj-gonder`, { numara: geciciVeri.numara, mesaj: ses });
                const cevap = rastgele(["Mesaj gönderildi efendim!", "Tamam efendim, mesajınız iletildi!", "Mesajınız gönderildi efendim, başka bir isteğiniz?"]);
                konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
            } catch {
                konusmaSentezi("Mesaj gönderilemedi efendim, WhatsApp servisi çalışıyor mu?");
                logEkle("🤖 Elion", "Hata: Mesaj gönderilemedi.");
            }
            setMod(null); setAltAdim(null); setGeciciVeri({});
        }
    };

    const gunlukAdim = async (ses) => {
        try {
            await axios.post(`${API_BASE}/gunluk`, { metin: ses });
            const cevap = rastgele(["Günlüğünüz kaydedildi efendim!", "Yazdım efendim, günlüğünüz hazır!", "Kaydettim efendim, güzel bir gün geçirin!"]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
        } catch {
            konusmaSentezi("Günlük kaydedilemedi efendim.");
            logEkle("🤖 Elion", "Hata: Günlük kaydedilemedi.");
        }
        setMod(null);
    };

    const uygulamaAdim = async (ses) => {
        try {
            await axios.post(`${API_BASE}/uygulama-ac`, { yol: ses });
            const cevap = rastgele(["Uygulamayı açıyorum efendim.", "Hemen başlatıyorum.", "Program karşınızda efendim."]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
        } catch {
            konusmaSentezi("Bu uygulamayı başlatamadım efendim.");
            logEkle("🤖 Elion", "Hata: Uygulama başlatılamadı.");
        }
        setMod(null);
    };

    const sistemAdim = async (ses) => {
        try {
            const res = await axios.post(`${API_BASE}/sistem`, { yol: ses });
            konusmaSentezi(res.data.mesaj); logEkle("🤖 Elion", res.data.mesaj);
        } catch {
            konusmaSentezi("Bu sistem komutunu uygulayamadım efendim.");
            logEkle("🤖 Elion", "Hata: Sistem komutu başarısız.");
        }
        setMod(null);
    };

    const dosyaAdim = async (ses) => {
        try {
            await axios.post(`${API_BASE}/dosya-ac`, { yol: ses });
            const cevap = rastgele(["İstediğiniz konumu açtım efendim.", "Hemen açıyorum.", "Klasör karşınızda efendim."]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);
        } catch {
            konusmaSentezi("Bu isimde bir konum bulamadım efendim. Doğru söylediğinize emin misiniz?");
            logEkle("🤖 Elion", "Hata: Dizin veya konum bulunamadı.");
        }
        setMod(null);
    };

    const dinlemeBaslat = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert("Chrome kullanın."); return; }
        const recognition = new SpeechRecognition();
        recognition.lang = "tr-TR";
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onstart = () => { setDinliyor(true); setDurum("Dinliyorum..."); };
        recognition.onresult = (event) => {
            const ses = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            setDurum(`Duydum: "${ses}"`);
            komutIsle(ses);
        };
        recognition.onerror = (e) => { setDurum("Hata: " + e.error); setDinliyor(false); };
        recognition.onend = () => {
            if (dinliyorRef.current) recognition.start();
        };
        recognitionRef.current = recognition;
        recognition.start();
    };

    const dinlemeDurdur = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setDinliyor(false);
        setDurum("Elion bekliyor. Mikrofona bas ve konuş.");
    };

    const klavyeGonder = () => {
        if (!yazilan.trim()) return;
        komutIsle(yazilan.toLowerCase().trim());
        setYazilan("");
    };

    const micClick = () => {
        if (!baslatildi) {
            elioniBaslat();
            return;
        }
        if (dinliyor) dinlemeDurdur();
        else dinlemeBaslat();
    };

    const resetElion = () => {
        dinlemeDurdur();
        setBaslatildi(false);
        setLoglar([]);
        setMod(null);
        setAltAdim(null);
        setGeciciVeri({});
        axios.delete(`${API_BASE}/sohbet`).catch(e => console.log("Sohbet temizlenemedi"));
    };

    if (!baslatildi) {
        // Automatically start in the background when the app loads
        // We still keep the 'baslatildi' state to prevent re-triggering greetings
    }

    return (
        <div className="flex flex-col h-screen bg-[#212121] text-gray-200 font-sans relative">
            {/* Ust Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shadow-sm">
                <div className="font-semibold text-xl tracking-wide flex items-center space-x-3">
                    <span className="text-cyan-400"><i className="fas fa-bolt"></i></span>
                    <span>Elion AI</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${dinliyor ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-gray-800 text-gray-400 border-white/5'}`}>
                        {dinliyor ? (
                            <><i className="fas fa-circle animate-pulse mr-2 text-[10px]"></i> Dinliyor...</>
                        ) : (
                            <><i className="fas fa-check-circle mr-2 text-[10px]"></i> Hazır</>
                        )}
                    </span>
                    <button onClick={resetElion} className="text-gray-400 hover:text-white transition-colors" title="Sohbeti Temizle">
                        <i className="fas fa-redo"></i>
                    </button>
                </div>
            </div>

            {/* Orta Alan: Sohbet Gecmisi veya Bos Durum */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-10 md:px-20 lg:px-40 xl:px-60 pb-40 pt-10 scroll-smooth">
                {loglar.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-fade-in mt-12">
                        <div className="mb-8 transform scale-[1.35] opacity-90 drop-shadow-2xl">
                            <AiAvatar listening={dinliyor} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-semibold mb-12 text-center text-white tracking-tight">Size nasıl yardımcı olabilirim?</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
                            {[
                                { title: "Film öner", sub: "Günün yorgunluğunu atacak bir film", icon: "fa-film" },
                                { title: "Kitap öner", sub: "Okunacaklar listene yeni bir eser", icon: "fa-book" },
                                { title: "Hatırlatma kur", sub: "Önemli işlerini senin yerine ben takip edeyim", icon: "fa-bell" },
                                { title: "Beni şaşırt", sub: "Gününe renk katacak bir söz", icon: "fa-magic" }
                            ].map((s, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => komutIsle(s.title.toLowerCase())}
                                    className="group flex flex-col items-start p-5 bg-gray-800/40 hover:bg-gray-700/60 border border-white/5 rounded-2xl transition-all duration-300 text-left hover:shadow-lg"
                                >
                                    <div className="flex items-center space-x-3 mb-2">
                                        <i className={`fas ${s.icon} text-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity`}></i>
                                        <span className="font-semibold text-gray-200 group-hover:text-white">{s.title}</span>
                                    </div>
                                    <span className="text-sm text-gray-400/80 group-hover:text-gray-300">{s.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col space-y-8">
                        {loglar.map((l, i) => {
                            const isUser = l.kimden.includes("Sen");
                            return (
                                <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                    {!isUser && (
                                        <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center mr-3 mt-1 shrink-0 border border-cyan-500/30">
                                            <i className="fas fa-robot text-cyan-400 text-xs"></i>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-4 ${isUser ? 'bg-gray-700 text-white rounded-br-sm' : 'bg-transparent text-gray-100'}`}>
                                        <div className="leading-relaxed whitespace-pre-wrap text-[15px]">{l.mesaj}</div>
                                    </div>
                                    {isUser && (
                                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center ml-3 mt-1 shrink-0">
                                            <i className="fas fa-user text-gray-300 text-xs"></i>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={logSonuRef} />
                    </div>
                )}
            </div>

            {/* Alt Alan: Chat Input */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#212121] via-[#212121] to-transparent pt-16 pb-8 px-4">
                <div className="max-w-4xl mx-auto relative flex flex-col items-center">
                    {mod && (
                        <div className="mb-4 text-cyan-400 text-sm bg-cyan-900/40 px-4 py-1.5 rounded-full border border-cyan-500/20 shadow-lg backdrop-blur-sm flex items-center space-x-2">
                            <i className="fas fa-cog spin-slow"></i>
                            <span>Mod: <strong>{mod}</strong> {altAdim ? `(${altAdim})` : ''}</span>
                        </div>
                    )}
                    
                    <div className="w-full flex items-center space-x-4">
                        {/* Huge Voice Button */}
                        <button 
                            type="button" 
                            onClick={micClick}
                            className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform shadow-2xl border-2 ${
                                dinliyor 
                                ? 'bg-red-500 text-white border-red-400 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-pulse' 
                                : 'bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            }`}
                            title={dinliyor ? "Dinlemeyi Durdur" : "Mikrofonla Konuş"}
                        >
                            <i className={`fas fa-microphone ${dinliyor ? 'text-2xl' : 'text-xl'}`}></i>
                        </button>
                        
                        {/* Text Input Pill */}
                        <div className="flex-1 flex items-center bg-[#2f2f2f] border border-white/10 rounded-full p-1.5 shadow-2xl focus-within:border-cyan-500/50 focus-within:bg-[#383838] transition-all">
                            <input
                                type="text"
                                className="flex-1 bg-transparent text-white px-5 py-3 outline-none text-base placeholder-gray-400"
                                placeholder="Elion'a yazılı mesaj gönder..."
                                value={yazilan}
                                onChange={(e) => setYazilan(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && klavyeGonder()}
                            />
                            
                            <button 
                                type="button" 
                                onClick={klavyeGonder}
                                disabled={!yazilan.trim()}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all mr-1 ${
                                    !yazilan.trim() 
                                    ? 'text-gray-500 bg-transparent' 
                                    : 'bg-white text-black hover:bg-gray-200 shadow-md transform hover:scale-105'
                                }`}
                            >
                                <i className="fas fa-arrow-up"></i>
                            </button>
                        </div>
                    </div>
                    <div className="text-center text-[12px] text-gray-500 mt-5 tracking-wide">
                        Elion AI hata yapabilir. Önemli bilgileri kontrol etmeyi unutmayın.
                    </div>
                </div>
            </div>
        </div>
    );
}