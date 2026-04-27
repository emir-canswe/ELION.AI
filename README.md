# ⚡ Elion AI — Kişisel Masaüstü Yapay Zeka Asistanı

<div align="center">

**Türkçe sesli ve yazılı komutlarla çalışan, Windows odaklı kişisel AI asistanı.**

Electron · React · FastAPI · PostgreSQL · WhatsApp Web.js

</div>

---

## 📖 Proje Hakkında

**Elion AI**, bilgisayarınızda çalışan tam donanımlı bir kişisel yapay zeka asistanıdır. Türkçe sesli komutlar veya yazılı mesajlarla etkileşime geçebilir, günlük görevlerinizi kolaylaştırabilirsiniz. ChatGPT benzeri modern bir arayüze sahip olan Elion, mikrofon ile konuşmanızı dinler, komutlarınızı anlar ve size sesli yanıt verir.

### 🎯 Ne İşe Yarar?

| Özellik | Açıklama |
|---|---|
| 🎤 **Sesli Komut** | Türkçe konuşma tanıma ile hands-free kullanım |
| ⌨️ **Yazılı Sohbet** | ChatGPT tarzı sohbet arayüzü ile yazılı komut desteği |
| 🎬 **Film Önerisi** | Veritabanındaki filmlerden rastgele öneri, hemen aratma |
| 📚 **Kitap Önerisi** | Veritabanındaki kitaplardan rastgele tavsiye |
| ⏰ **Hatırlatma** | Tarih ve saat belirterek hatırlatma kurma |
| 📝 **Günlük** | Sesli veya yazılı günlük tutma |
| 📂 **Dosya Yönetimi** | Bilgisayardaki klasör ve dosyaları açma (Masaüstü, İndirilenler, Belgeler, sürücüler vb.) |
| 🖥️ **Uygulama Açma** | Hesap makinesi, Chrome, Not Defteri gibi uygulamaları sesle başlatma |
| 🔒 **Sistem Kontrolü** | Ekranı kilitleme, bilgisayarı kapatma/yeniden başlatma |
| 🔍 **Google Arama** | Sesle söylediğiniz sorguyu Google'da aratma |
| 🎵 **YouTube Arama** | Şarkı, video veya herhangi bir içeriği YouTube'da açma |
| 💬 **WhatsApp Mesaj** | Sesli komutla WhatsApp üzerinden mesaj gönderme |
| 💾 **Sohbet Geçmişi** | Tüm konuşmalar PostgreSQL veritabanında kalıcı olarak saklanır |
| 🗣️ **Sesli Yanıt** | Elion tüm yanıtlarını Türkçe ses sentezi ile sesli söyler |
| 🤖 **Animasyonlu Avatar** | Neon ışıklı, göz kırpan ve konuşurken ağız hareket eden SVG asistan avatarı |

### 🧠 Akıllı Komut Tanıma

Elion, Türkçe karakter toleranslı **fuzzy matching** (Fuse.js) kullanır. Yazım hatası yapsanız bile komutlarınızı anlayabilir:

- `"filmm oner"` → Film öner ✅
- `"youtuube ac"` → YouTube aç ✅
- `"hatirlatma ekle"` → Hatırlatma ekle ✅

---

## 🏗️ Mimari

```
Elion/
├── electron-app/      # Electron masaüstü kabuğu (tüm servisleri başlatır)
│   ├── main.js        # Ana süreç: backend, frontend, whatsapp başlatma
│   └── package.json
├── frontend/          # React arayüz (ChatGPT tarzı tek sayfa)
│   └── src/
│       ├── pages/
│       │   └── Dashboard.js   # Ana sohbet arayüzü + tüm komut mantığı
│       └── components/
│           └── AiAvatar.js    # Animasyonlu SVG asistan avatarı
├── backend/           # FastAPI REST API
│   ├── main.py        # Tüm endpoint'ler (CRUD + dosya + sistem)
│   ├── create_tables.py  # PostgreSQL tablo oluşturma scripti
│   ├── requirements.txt
│   └── .env.example
├── whatsapp-service/  # WhatsApp Web.js mesaj servisi
│   └── index.js       # Express API (port 3001)
├── baslat.bat         # Tek tıkla başlatma scripti
└── .gitignore
```

### Servisler ve Portlar

| Servis | Port | Teknoloji |
|---|---|---|
| Frontend | `3000` | React (CRA) |
| Backend API | `8000` | FastAPI + Uvicorn |
| WhatsApp | `3001` | Express + whatsapp-web.js |

---

## ⚙️ Gereksinimler

- **Node.js** 18+ (LTS önerilir)
- **Python** 3.10+
- **PostgreSQL** 14+ (yerel veya uzak)
- **Windows** (dosya açma, uygulama başlatma ve sistem komutları Windows'a özeldir)

---

## 🚀 Kurulum

### 1. Depoyu Klonlayın

```bash
git clone https://github.com/emir-canswe/ELION.AI.git
cd ELION.AI
```

### 2. Backend (Python + FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` dosyasını kendi PostgreSQL ayarlarınıza göre düzenleyin:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=elion
```

Veritabanı tablolarını oluşturun:

```bash
python create_tables.py
```

### 3. Frontend (React)

```bash
cd frontend
npm install
```

### 4. WhatsApp Servisi (İsteğe Bağlı)

```bash
cd whatsapp-service
npm install
```

> İlk çalıştırmada terminalde QR kodu görünür; telefonunuzdan WhatsApp → Bağlı Cihazlar ile okutun.

### 5. Electron (Masaüstü Kabuğu)

```bash
cd electron-app
npm install
```

---

## ▶️ Çalıştırma

### Tek Komutla (Önerilen)

Electron tüm servisleri (backend, frontend, whatsapp) otomatik başlatır:

```bash
cd electron-app
npm start
```

Veya proje kök dizininde:

```bash
baslat.bat
```

### Geliştirme Modu (Ayrı Terminaller)

Üç ayrı terminal açın:

```bash
# Terminal 1 — Backend
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2 — Frontend
cd frontend
npm start

# Terminal 3 — WhatsApp (isteğe bağlı)
cd whatsapp-service
node index.js
```

### Port Çakışması

Varsayılan portlar doluysa:

```bash
set ELION_FRONTEND_PORT=3002
npm start
```

`frontend\.env` içinde de `PORT=3002` olarak güncelleyin.

---

## 🗄️ Veritabanı Şeması

PostgreSQL üzerinde 5 tablo kullanılır:

| Tablo | Açıklama |
|---|---|
| `kitaplar` | Kitap önerileri (id, ad) |
| `filmler` | Film önerileri (id, ad) |
| `hatirlatmalar` | Hatırlatmalar (id, metin, tarih_saat) |
| `gunluk` | Günlük notları (id, tarih, metin) |
| `sohbet_gecmisi` | Sohbet geçmişi (id, kimden, mesaj, zaman) |

---

## 🗣️ Desteklenen Sesli Komutlar

```
"Merhaba Elion"          → Selamlama
"Nasılsın"               → Hal hatır sorma
"Film öner"              → Rastgele film önerisi
"Kitap öner"             → Rastgele kitap tavsiyesi
"YouTube aç"             → YouTube'da arama
"Google'da ara"          → Google'da arama
"Hatırlatma ekle"        → Yeni hatırlatma oluşturma
"Günlük yaz"             → Günlük notu kaydetme
"Mesaj gönder"           → WhatsApp üzerinden mesaj
"İndirilenleri aç"       → İndirilenler klasörünü açma
"Masaüstünü aç"          → Masaüstü klasörünü açma
"Hesap makinesi"         → Uygulama başlatma
"Bilgisayarı kilitle"    → Ekran kilitleme
"Saat kaç"               → Anlık saat bilgisi
"Bugün ne"               → Tarih bilgisi
"Beni şaşırt"            → Motivasyon sözleri
"Yardım"                 → Tüm komutları listeleme
"Görüşürüz"              → Dinlemeyi durdurma
```

---

## 📦 Windows Kurulum Paketi (NSIS)

Electron Builder ile `.exe` installer oluşturabilirsiniz:

```bash
cd electron-app
npm run build
```

Özel ikon eklemek için `electron-app\icon.ico` dosyası koyun.

---

## 🐛 Sorun Giderme

| Sorun | Çözüm |
|---|---|
| Beyaz ekran / "Başlatılıyor" | `frontend` klasöründe `npm install` yapıldığından emin olun |
| `venv bulunamadı` | `backend` klasöründe `python -m venv venv` çalıştırın |
| API / CORS hatası | Backend `localhost` ve `127.0.0.1` üzerinden gelen tüm portlara izin verir |
| WhatsApp bağlanmıyor | Terminaldeki QR kodu kontrol edin; `node_modules` kurulu olmalı |
| PostgreSQL bağlantı hatası | `.env` dosyasındaki bilgileri ve PostgreSQL servisinin çalıştığını kontrol edin |

---

## 🛡️ Güvenlik

- `.env` dosyaları `.gitignore` ile repo dışında tutulur
- `node_modules` klasörleri versiyon kontrolüne dahil değildir
- Sistem kapatma/yeniden başlatma komutları güvenlik amacıyla test modunda devre dışıdır

---

## 👤 Geliştirici

**emir-canswe**

---

## 📄 Lisans

Bu proje açık kaynaklıdır. Dilediğiniz gibi kullanabilir ve geliştirebilirsiniz.
