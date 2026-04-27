from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import psycopg2
import os
import requests
from datetime import datetime
import g4f

load_dotenv()

app = FastAPI(title="Elion API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'elion'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASS', 'postgres')
    )

# --- MODELLER ---
class HatirlatmaEkle(BaseModel):
    metin: str
    tarih_saat: str

class GunlukEkle(BaseModel):
    metin: str

class KitapEkle(BaseModel):
    ad: str

class FilmEkle(BaseModel):
    ad: str

class DosyaYol(BaseModel):
    yol: str

class WhatsAppMesaj(BaseModel):
    numara: str
    mesaj: str

class SohbetEkle(BaseModel):
    kimden: str
    mesaj: str

# --- SAĞLIK ---
@app.get("/")
def health_check():
    return {"status": "Elion API çalışıyor 🚀", "version": "2.0.0"}

@app.get("/db-test")
def db_test():
    try:
        conn = get_db()
        conn.close()
        return {"status": "Veritabanı bağlantısı başarılı ✅"}
    except Exception as e:
        return {"status": "Bağlantı hatası ❌", "hata": str(e)}

# --- KİTAPLAR ---
@app.get("/kitaplar")
def kitaplari_getir():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kitaplar")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "ad": r[1]} for r in rows]

@app.post("/kitaplar")
def kitap_ekle(data: KitapEkle):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO kitaplar (ad) VALUES (%s)", (data.ad,))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Kitap eklendi"}

@app.get("/kitaplar/rastgele")
def rastgele_kitap():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM kitaplar ORDER BY RANDOM() LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "ad": row[1]}
    raise HTTPException(status_code=404, detail="Kitap bulunamadı")

# --- FİLMLER ---
@app.get("/filmler")
def filmleri_getir():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM filmler")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "ad": r[1]} for r in rows]

@app.post("/filmler")
def film_ekle(data: FilmEkle):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO filmler (ad) VALUES (%s)", (data.ad,))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Film eklendi"}

@app.get("/filmler/rastgele")
def rastgele_film():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM filmler ORDER BY RANDOM() LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if row:
        return {"id": row[0], "ad": row[1]}
    raise HTTPException(status_code=404, detail="Film bulunamadı")

# --- HATIRLATMALAR ---
@app.get("/hatirlatmalar")
def hatirlatmalari_getir():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM hatirlatmalar ORDER BY tarih_saat ASC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "metin": r[1], "tarih_saat": str(r[2])} for r in rows]

@app.post("/hatirlatmalar")
def hatirlatma_ekle(data: HatirlatmaEkle):
    try:
        tarih_saat = datetime.strptime(data.tarih_saat, "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Tarih formatı hatalı. Örnek: 2025-05-08 14:30")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO hatirlatmalar (metin, tarih_saat) VALUES (%s, %s)", (data.metin, tarih_saat))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Hatırlatma eklendi"}

@app.delete("/hatirlatmalar/{id}")
def hatirlatma_sil(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hatirlatmalar WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return {"success": True}

# --- GÜNLÜK ---
@app.get("/gunluk")
def gunluk_getir():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM gunluk ORDER BY tarih DESC")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "tarih": str(r[1]), "metin": r[2]} for r in rows]

@app.post("/gunluk")
def gunluk_ekle(data: GunlukEkle):
    tarih = datetime.now().date()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO gunluk (tarih, metin) VALUES (%s, %s)", (tarih, data.metin))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Günlük kaydedildi"}

# --- SOHBET GEÇMİŞİ ---
@app.get("/sohbet")
def sohbet_getir():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sohbet_gecmisi ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "kimden": r[1], "mesaj": r[2], "zaman": r[3].strftime("%H:%M") if r[3] else ""} for r in rows]
    except Exception as e:
        print("Sohbet getirme hatası:", e)
        return []

@app.post("/sohbet")
def sohbet_ekle(data: SohbetEkle):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO sohbet_gecmisi (kimden, mesaj) VALUES (%s, %s)", (data.kimden, data.mesaj))
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        print("Sohbet kaydetme hatası:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sohbet")
def sohbet_temizle():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sohbet_gecmisi")
        conn.commit()
        conn.close()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- DOSYA SİSTEMİ ---
@app.get("/dosyalar")
def kok_dizin():
    drives = ["C:\\", "D:\\", "E:\\"]
    mevcut = [d for d in drives if os.path.exists(d)]
    return {"dizinler": mevcut, "dosyalar": []}

@app.post("/dosyalar")
def dizin_oku(data: DosyaYol):
    yol = data.yol
    if not os.path.exists(yol):
        raise HTTPException(status_code=404, detail="Yol bulunamadı")
    try:
        icerik = os.listdir(yol)
        dizinler = []
        dosyalar = []
        for item in icerik:
            tam_yol = os.path.join(yol, item)
            if os.path.isdir(tam_yol):
                dizinler.append({"ad": item, "yol": tam_yol})
            else:
                dosyalar.append({"ad": item, "yol": tam_yol})
        return {"dizinler": dizinler, "dosyalar": dosyalar}
    except PermissionError:
        raise HTTPException(status_code=403, detail="Erişim engellendi")

@app.post("/dosya-ac")
def dosya_ac(data: DosyaYol):
    try:
        yol = data.yol.lower().strip()
        home = os.path.expanduser('~')
        hedef_yol = data.yol # varsayilan olarak orjinal giris
        
        # Ozel Windows klasorleri ve Suruculer (Turkce konusma varyasyonlari)
        if yol in ["downloads", "indirilenler", "indirmeler"]:
            hedef_yol = os.path.join(home, "Downloads")
        elif yol in ["desktop", "masaüstü", "masaustu"]:
            hedef_yol = os.path.join(home, "Desktop")
        elif yol in ["documents", "belgeler", "belgelerim"]:
            hedef_yol = os.path.join(home, "Documents")
        elif yol in ["pictures", "resimler", "fotoğraflar"]:
            hedef_yol = os.path.join(home, "Pictures")
        elif yol in ["videos", "videolar"]:
            hedef_yol = os.path.join(home, "Videos")
        elif yol in ["music", "müzikler", "müzik", "sarkilar"]:
            hedef_yol = os.path.join(home, "Music")
        elif yol in ["c", "c dizini", "c sürücüsü", "c surucusu"]:
            hedef_yol = "C:\\"
        elif yol in ["d", "d dizini", "d sürücüsü", "d surucusu"]:
            hedef_yol = "D:\\"
        elif yol in ["e", "e dizini", "e sürücüsü", "e surucusu"]:
            hedef_yol = "E:\\"
            
        if not os.path.exists(hedef_yol):
            raise HTTPException(status_code=404, detail=f"Dizin bulunamadı: {hedef_yol}")
            
        os.startfile(hedef_yol)
        return {"success": True, "mesaj": f"{hedef_yol} açıldı"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/uygulama-ac")
def uygulama_ac(data: DosyaYol):
    app_name = data.yol.lower()
    try:
        if "hesap" in app_name or "calc" in app_name:
            os.system("calc")
        elif "chrome" in app_name or "tarayıcı" in app_name:
            os.system("start chrome")
        elif "not" in app_name or "notepad" in app_name:
            os.system("notepad")
        else:
            os.system(f"start {app_name}")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sistem")
def sistem_komut(data: DosyaYol):
    komut = data.yol.lower()
    try:
        if "kapat" in komut:
            # os.system("shutdown /s /t 0") # Test asamasinda kapattim yanlislikla kapanmasin
            return {"success": True, "mesaj": "Bilgisayar kapatılıyor (Test modunda devre dışı)"}
        elif "yeniden" in komut:
            return {"success": True, "mesaj": "Bilgisayar yeniden başlatılıyor (Test modunda devre dışı)"}
        elif "kilitle" in komut:
            os.system("rundll32.exe user32.dll,LockWorkStation")
            return {"success": True, "mesaj": "Ekran kilitlendi"}
        else:
            return {"success": False, "mesaj": "Bilinmeyen sistem komutu."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- WHATSAPP ---
@app.post("/whatsapp/mesaj-gonder")
def whatsapp_mesaj_gonder(data: WhatsAppMesaj):
    try:
        response = requests.post(
            "http://localhost:3001/mesaj-gonder",
            json={"numara": data.numara, "mesaj": data.mesaj}
        )
        return response.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"WhatsApp servisi çalışmıyor: {str(e)}")