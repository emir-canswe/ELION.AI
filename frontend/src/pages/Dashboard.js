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
};

const tumKomutlar = Object.entries(KOMUTLAR).flatMap(([kategori, kelimeler]) =>
    kelimeler.map(kelime => ({ kategori, kelime }))
);

const fuse = new Fuse(tumKomutlar, {
    keys: ["kelime"],
    threshold: 0.4,
    distance: 100,
});

function komutBul(ses) {
    const sonuc = fuse.search(ses);
    if (sonuc.length > 0) return sonuc[0].item.kategori;
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

    const logEkle = (kimden, mesaj) => {
        setLoglar(prev => [...prev, { kimden, mesaj, zaman: new Date().toLocaleTimeString() }]);
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
                "Dosya gezginini açıyorum efendim.",
                "Hemen dosyalara bakıyorum efendim.",
                "Dosya sayfasına yönlendiriyorum efendim."
            ]);
            konusmaSentezi(cevap); logEkle("🤖 Elion", cevap);

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
    };

    if (!baslatildi) {
        return (
            <div className="elion-dash-root elion-dash-root--clean">
                <div className="elion-dash-centered">
                    <div className="elion-ai-hero elion-ai-hero--tight">
                        <AiAvatar listening={false} />
                        <div className="elion-speech elion-glass elion-speech--clean">
                            <div className="elion-speech__head">
                                <span className="elion-speech__title">Assistant</span>
                                <span className="elion-online-badge elion-online-badge--off">
                                    <i className="fas fa-circle" /> Beklemede
                                </span>
                            </div>
                            <p className="elion-speech__sub">Elion · kişisel yapay zeka</p>
                            <p className="elion-speech__body">
                                Mikrofon düğmesine basarak başlat.
                            </p>
                        </div>
                    </div>
                    <div className={`ai-core-container ai-core-container--clean${dinliyor ? " is-listening" : ""}`}>
                        <div className="ring ring-1" />
                        <div className="ring ring-2" />
                        <div className="ring ring-3" />
                        <div className="pulse-layer" />
                        <div className="pulse-layer" />
                        <div className="pulse-layer" />
                        <button type="button" className="mic-button" onClick={micClick}>
                            <i className="fas fa-microphone" aria-hidden />
                            <span>BAŞLAT</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="elion-dash-root elion-dash-root--clean">
            <div className="elion-dash-centered">
                <div className="elion-dash-inline-tools">
                    <span className={`elion-pill${dinliyor ? " elion-pill--live" : ""}`}>
                        {dinliyor ? "canlı" : "hazır"}
                    </span>
                    <button type="button" className="elion-btn-ghost elion-btn-ghost--small" onClick={resetElion}>
                        Oturumu kapat
                    </button>
                </div>

                <div className="elion-ai-hero elion-ai-hero--tight">
                    <AiAvatar listening={dinliyor} />
                    <div className="elion-speech elion-glass elion-speech--clean">
                        <div className="elion-speech__head">
                            <span className="elion-speech__title">Assistant</span>
                            <span className={`elion-online-badge ${dinliyor ? "elion-online-badge--live" : ""}`}>
                                <i className="fas fa-circle" />
                                {dinliyor ? "Çevrimiçi" : "Hazır"}
                            </span>
                        </div>
                        <p className="elion-speech__sub">Elion · kişisel yapay zeka</p>
                        <p className={`elion-speech__body ${dinliyor ? "elion-speech__body--live" : ""}`}>{durum}</p>
                        {mod && (
                            <p className="elion-mode-line elion-mode-line--clean">
                                {mod}
                                {altAdim ? ` · ${altAdim}` : ""}
                            </p>
                        )}
                    </div>
                </div>

                <div className={`ai-core-container ai-core-container--clean${dinliyor ? " is-listening" : ""}`}>
                    <div className="ring ring-1" />
                    <div className="ring ring-2" />
                    <div className="ring ring-3" />
                    <div className="pulse-layer" />
                    <div className="pulse-layer" />
                    <div className="pulse-layer" />
                    <button
                        type="button"
                        className={`mic-button${dinliyor ? " listening" : ""}`}
                        onClick={micClick}
                    >
                        <i className="fas fa-microphone" aria-hidden />
                        <span>{dinliyor ? "DURDUR" : "DİNLE"}</span>
                    </button>
                </div>
            </div>

            <div className="elion-dash-unified elion-glass">
                <section className="elion-dash-unified__section">
                    <h4 className="elion-panel-title">Konuşma</h4>
                    <div className="elion-log-scroll elion-log-scroll--clean">
                        {loglar.length === 0 && <p className="elion-muted">Henüz kayıt yok.</p>}
                        {loglar.map((l, i) => {
                            const user = l.kimden.includes("Sen");
                            return (
                                <div
                                    key={i}
                                    className={`elion-log-bubble ${user ? "elion-log-bubble--user" : "elion-log-bubble--elion"}`}
                                >
                                    <div className="elion-log-meta">
                                        {l.kimden} · {l.zaman}
                                    </div>
                                    {l.mesaj}
                                </div>
                            );
                        })}
                        <div ref={logSonuRef} />
                    </div>
                </section>

                <div className="elion-dash-unified__divider" />

                <section className="elion-dash-unified__section">
                    <h4 className="elion-panel-title">Metin komutu</h4>
                    <div className="elion-row-input">
                        <input
                            type="text"
                            className="elion-input"
                            style={{ flex: 1 }}
                            value={yazilan}
                            onChange={(e) => setYazilan(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && klavyeGonder()}
                            placeholder="Yaz ve Enter…"
                        />
                        <button type="button" className="elion-btn" onClick={klavyeGonder}>
                            <i className="fas fa-paper-plane" aria-hidden />
                        </button>
                    </div>
                </section>

                <div className="elion-dash-unified__divider" />

                <section className="elion-dash-unified__section">
                    <button
                        type="button"
                        className="elion-cmd-toggle"
                        onClick={() => setKomutlarAcik((k) => !k)}
                    >
                        <i className="fas fa-lightbulb" aria-hidden />
                        Komut örnekleri {komutlarAcik ? "▲" : "▼"}
                    </button>
                    {komutlarAcik && (
                        <div className="elion-cmd-grid elion-cmd-grid--clean">
                            {[
                                "Film öner",
                                "Kitap öner",
                                "Hatırlatma ekle",
                                "Mesaj gönder",
                                "Google'da ara",
                                "YouTube aç",
                                "Dosyaları aç",
                                "Günlük yaz",
                                "Merhaba",
                                "Saat kaç",
                                "Bugün ne günü",
                                "Beni şaşırt",
                            ].map((k, i) => (
                                <div key={i} className="elion-cmd-chip">
                                    {k}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}