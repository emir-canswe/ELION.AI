from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pyodbc
import os
import requests
from datetime import datetime

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
    conn_str = (
        f"Driver={os.getenv('DB_DRIVER')};"
        f"Server={os.getenv('DB_SERVER')};"
        f"Database={os.getenv('DB_DATABASE')};"
        f"Trusted_Connection={os.getenv('DB_TRUSTED_CONNECTION')};"
    )
    return pyodbc.connect(conn_str)

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
    cursor.execute("INSERT INTO kitaplar (ad) VALUES (?)", (data.ad,))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Kitap eklendi"}

@app.get("/kitaplar/rastgele")
def rastgele_kitap():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM kitaplar ORDER BY NEWID()")
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
    cursor.execute("INSERT INTO filmler (ad) VALUES (?)", (data.ad,))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Film eklendi"}

@app.get("/filmler/rastgele")
def rastgele_film():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 1 * FROM filmler ORDER BY NEWID()")
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
    cursor.execute("INSERT INTO hatirlatmalar (metin, tarih_saat) VALUES (?, ?)", (data.metin, tarih_saat))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Hatırlatma eklendi"}

@app.delete("/hatirlatmalar/{id}")
def hatirlatma_sil(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hatirlatmalar WHERE id = ?", (id,))
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
    cursor.execute("INSERT INTO gunluk (tarih, metin) VALUES (?, ?)", (tarih, data.metin))
    conn.commit()
    conn.close()
    return {"success": True, "mesaj": "Günlük kaydedildi"}

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
        os.startfile(data.yol)
        return {"success": True, "mesaj": "Dosya açıldı"}
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