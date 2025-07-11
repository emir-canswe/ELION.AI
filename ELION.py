from gtts import gTTS
import speech_recognition as sr
import random
import os
import pygame
from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import pyodbc
from datetime import datetime

r = sr.Recognizer()

tepki1 = ["merhaba", "merhaba alion", "alion", "hey alion"]
tepki2 = ["nasılsın alion", "bugün nasılsın", "keyifler nasıl kral", "ne haber lan", "nasılsın"]
tepki3 = ["youtube bağlan", "bana şarkı aç", "şarkı aç", "youtube", "alion bana bir şarkı aç hele", "alion şarkı aç"]
tepki4 = ["alion googleye bağlan", "acil googleye bağlan", "googleyi aç", "internete bağlan", "arama yap"]
kitap_komutlari = ["alion bana kitap öner", "kitap öner", "bana bir kitap öner", "kitap tavsiye et"]
yeniden_kitap = ["başka öner", "tekrar", "beğenmedim", "yenisini öner"]
film_komutlari = ["alion bana film öner", "film öner", "bana bir film öner", "film tavsiye et"]
yeniden_film = ["başka öner", "tekrar", "beğenmedim", "yenisini öner"]
hatirlatma_komutlari = ["hatırlat", "hatırlatma ekle", "bir şey hatırlat", "bana hatırlatma kur"]
gunluk_komutlari = ["günlük yaz", "günlüğe not ekle", "bugünkü notum", "günlük"]

class SesliAsistan:
    def __init__(self):
        pygame.mixer.init()
        self.veritabani_baglantisi()

    def veritabani_baglantisi(self):
        try:
            self.conn = pyodbc.connect(
                'Driver={SQL Server};'
                'Server=DESKTOP-1RCE6B5\\SQLEXPRESS;'
                'Database=alion;'
                'Trusted_Connection=yes;'
            )
            self.cursor = self.conn.cursor()
        except Exception as e:
            print("Veritabanı bağlantı hatası:", e)

    def seslendirme(self, metin):
        dosya = str(random.randint(0, 1000000000)) + ".mp3"
        try:
            ses = gTTS(text=metin, lang="tr", slow=False)
            ses.save(dosya)
            pygame.mixer.music.load(dosya)
            pygame.mixer.music.play()
            while pygame.mixer.music.get_busy():
                continue
            pygame.mixer.music.unload()
        except Exception as e:
            print("Seslendirme hatası:", e)
        finally:
            if os.path.exists(dosya):
                os.remove(dosya)

    def mikrofon(self):
        with sr.Microphone() as kaynak:
            r.adjust_for_ambient_noise(kaynak, duration=1)
            print("Seni dinliyorum...")
            ses = r.listen(kaynak)
            try:
                metin = r.recognize_google(ses, language="tr-TR")
                return metin.lower()
            except sr.UnknownValueError:
                self.seslendirme("Ne dediğini anlayamadım.")
                return ""
            except sr.RequestError:
                self.seslendirme("Ses tanıma servisine ulaşılamıyor.")
                return ""

    def kitap_oner(self):
        while True:
            self.cursor.execute("SELECT * FROM kitap")
            kitaplar = self.cursor.fetchall()
            if kitaplar:
                secilen = random.choice(kitaplar)
                kitap_ad = secilen[1] if len(secilen) > 1 else "Bilinmeyen Kitap"
                self.seslendirme(f"Sana önerim: {kitap_ad}")
                print("Önerilen Kitap:", kitap_ad)
                cevap = self.mikrofon()
                if cevap not in yeniden_kitap:
                    break
            else:
                self.seslendirme("Veritabanında kitap bulunamadı.")
                break

    def film_oner(self):
        while True:
            self.cursor.execute("SELECT * FROM filmler")
            filmler = self.cursor.fetchall()
            if filmler:
                secilen = random.choice(filmler)
                film_ad = secilen[1] if len(secilen) > 1 else "Bilinmeyen film"
                self.seslendirme(f"Sana önerim: {film_ad}")
                print("Önerilen Film:", film_ad)
                cevap = self.mikrofon()
                if cevap not in yeniden_film:
                    break
            else:
                self.seslendirme("Veritabanında film bulunamadı.")
                break

    def hatirlatma_ekle(self):
        self.seslendirme("Ne hatırlatmamı istersin?")
        metin = self.mikrofon()
        self.seslendirme("Ne zaman hatırlatayım? Örnek: 2025-05-08 14:30")
        zaman = self.mikrofon()
        try:
            tarih_saat = datetime.strptime(zaman, "%Y-%m-%d %H:%M")
            self.cursor.execute("INSERT INTO hatirlatmalar (metin, tarih_saat) VALUES (?, ?)", metin, tarih_saat)
            self.conn.commit()
            self.seslendirme("Hatırlatma kaydedildi.")
        except:
            self.seslendirme("Tarihi anlayamadım. Lütfen formatı doğru gir.")

    def hatirlatmalari_kontrol_et(self):
        now = datetime.now()
        self.cursor.execute("SELECT * FROM hatirlatmalar WHERE tarih_saat <= ?", now)
        hatirlatmalar = self.cursor.fetchall()
        for h in hatirlatmalar:
            self.seslendirme("Hatırlatma: " + h[1])
            self.cursor.execute("DELETE FROM hatirlatmalar WHERE id = ?", h[0])
            self.conn.commit()

    def gunluk_ekle(self):
        self.seslendirme("Bugünkü günlüğünü söyle.")
        metin = self.mikrofon()
        tarih = datetime.now().date()
        self.cursor.execute("INSERT INTO gunluk (tarih, metin) VALUES (?, ?)", tarih, metin)
        self.conn.commit()
        self.seslendirme("Günlük kaydedildi.")

    def ses_karsilikli(self, gelen_Ses):
        if gelen_Ses in tepki1:
            self.seslendirme("Merhaba efendim, hoş geldin!")

        elif gelen_Ses in tepki2:
            self.seslendirme("İyiyim efendim, sen nasılsın?")

        elif gelen_Ses in tepki3:
            self.seslendirme("Bağlanıyorum efendim.")
            cevap = self.mikrofon()
            if cevap:
                url = "https://www.youtube.com/results?search_query=" + cevap
                tarayici = webdriver.Edge()
                tarayici.get(url)
                time.sleep(5)
                tarayici.quit()

        elif gelen_Ses in tepki4:
            self.seslendirme("Ne aramamı istersiniz?")
            cevap = self.mikrofon()
            if cevap:
                url = "https://www.google.com/search?q=" + cevap
                self.seslendirme("Bulduğum içerikler bunlar.")
                tarayici = webdriver.Edge()
                tarayici.get(url)
                time.sleep(5)
                tarayici.quit()

        elif gelen_Ses in kitap_komutlari:
            self.kitap_oner()

        elif gelen_Ses in film_komutlari:
            self.film_oner()

        elif gelen_Ses in hatirlatma_komutlari:
            self.hatirlatma_ekle()

        elif gelen_Ses in gunluk_komutlari:
            self.gunluk_ekle()

# --- Asistanı Başlat ---
asistan = SesliAsistan()

while True:
    asistan.hatirlatmalari_kontrol_et()
    gelen_Ses = asistan.mikrofon()
    if gelen_Ses:
        print(f"Kullanıcı: {gelen_Ses}")
        asistan.ses_karsilikli(gelen_Ses)
