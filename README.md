# Elion AI

Windows odaklı kişisel asistan: **Electron** masaüstü kabuğu, **React** arayüz, **FastAPI** + **SQL Server** API ve isteğe bağlı **WhatsApp Web.js** servisi.

## Gereksinimler

- Node.js 18+ (LTS önerilir)
- Python 3.11+ (veya 3.10+)
- SQL Server + uygun [ODBC Driver](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server) (ör. 17 veya 18)
- Windows (dosya açma ve Electron betiği buna göre yazıldı)

## Kurulum (ilk klon)

### 1. Backend

```text
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` içinde `DB_DRIVER`, `DB_SERVER`, `DB_DATABASE`, `DB_TRUSTED_CONNECTION` değerlerini kendi SQL Server kurulumunuza göre düzenleyin. Tablolar için:

```text
python create_tables.py
```

### 2. Frontend

```text
cd frontend
npm install
```

İsteğe bağlı: `frontend\.env.example` dosyasını `.env` olarak kopyalayın (API adresi / port).

### 3. WhatsApp servisi (isteğe bağlı)

```text
cd whatsapp-service
npm install
```

İlk çalıştırmada QR kodu **terminalde** görünür; telefondan okutun.

### 4. Electron

```text
cd electron-app
npm install
```

## Çalıştırma

En pratik yol: **Electron** tüm servisleri başlatır.

```text
cd electron-app
npm start
```

- Arayüz varsayılan: `http://127.0.0.1:3000` (React)
- API: `http://127.0.0.1:8000`
- WhatsApp servisi: `http://127.0.0.1:3001`

Port çakışması varsa Electron’u şöyle başlatın:

```text
set ELION_FRONTEND_PORT=3002
npm start
```

Aynı portu React’e vermek için `frontend\.env` içinde `PORT=3002` kullanın.

### Electron olmadan (geliştirme)

Üç ayrı terminal:

1. `backend`: `venv\Scripts\activate` → `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`
2. `frontend`: `npm start`
3. `whatsapp-service`: `npm start`

## GitHub’a gönderme

Bu depoda **gizli anahtar veya `.env` yok**; `backend\.env` ve `node_modules` `.gitignore` ile dışarıda kalır.

```text
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

Daha önce `backend\.env` veya `node_modules` commitlendiyse:

```text
git rm -r --cached backend/.env frontend/node_modules electron-app/node_modules whatsapp-service/node_modules 2>nul
git commit -m "Stop tracking env and node_modules"
```

## Windows kurulum paketi (NSIS)

`electron-app` içinde:

```text
npm run build
```

Özel `.ico` isterseniz `electron-app\icon.ico` ekleyebilirsiniz; yoksa varsayılan paketleme ayarları kullanılır.

## Sorun giderme

- **Beyaz ekran / “Başlatılıyor”:** Terminalde `[frontend]` loglarına bakın; `frontend` klasöründe `npm install` yapıldığından emin olun.
- **`venv bulunamadı`:** Backend adımlarını tekrarlayın; `backend\venv\Scripts\python.exe` oluşmalı.
- **API / CORS:** Backend `localhost` ve `127.0.0.1` üzerinden gelen tüm portlara izin verecek şekilde yapılandırıldı.
- **WhatsApp:** `whatsapp-service` terminalinde QR’ı kontrol edin; `node_modules` kurulu olmalı.
