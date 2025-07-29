import threading
import queue
import time
import os
import random
import logging
from datetime import datetime
from gtts import gTTS
import speech_recognition as sr
import pygame
import pyodbc
from selenium import webdriver
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.common.exceptions import WebDriverException

# --- CONFIG ---
DATABASE_CONFIG = {
    'driver': '{SQL Server}',               # SQL Server driver
    'server': 'DESKTOP-1RCE6B5\\SQLEXPRESS',  # SQL Server instance adı
    'database': 'elion',                    # Veritabanı adı
    'trusted_connection': 'yes'             # Windows Authentication kullanımı
}

WEBDRIVER_BROWSER = 'edge'  # Kullanılacak tarayıcı (edge, chrome, firefox)

# --- LOGGING SETUP ---
logging.basicConfig(
    filename='elion_asistan.log',  # Logların yazılacağı dosya
    filemode='a',                  # Dosyaya ekleme modu
    format='%(asctime)s - %(levelname)s - %(message)s',  # Log formatı
    level=logging.INFO             # Log seviyesi
)

# --- SES OYNATICI SINIFI ---
class SesOynatici:
    def __init__(self):
        pygame.mixer.init()              # Pygame ses modülünü başlatır
        self.play_queue = queue.Queue()  # Ses dosyalarının sırayla oynatılması için kuyruk
        self.thread = threading.Thread(target=self._player_thread, daemon=True) # Arka planda ses çalma thread'i
        self.thread.start()
        logging.info("Ses oynatıcı başlatıldı.")

    def _player_thread(self):
        # Kuyruktan dosya alıp oynatan thread fonksiyonu
        while True:
            dosya = self.play_queue.get()
            if dosya is None:  # Kuyruk sonlandırma sinyali
                break
            try:
                pygame.mixer.music.load(dosya)  # Dosyayı yükle
                pygame.mixer.music.play()       # Çal
                while pygame.mixer.music.get_busy():
                    time.sleep(0.1)             # Çalma bitene kadar bekle
                pygame.mixer.music.unload()     # Belleği temizle
                os.remove(dosya)                # Geçici mp3 dosyasını sil
                logging.info(f"{dosya} başarıyla çalındı ve silindi.")
            except Exception as e:
                logging.error(f"Ses oynatma hatası: {e}")

    def seslendir(self, metin):
        try:
            dosya_adi = f"tts_{random.randint(0, 1_000_000_000)}.mp3" # Benzersiz dosya adı oluştur
            tts = gTTS(text=metin, lang="tr", slow=False)             # Google Text-to-Speech ile mp3 oluştur
            tts.save(dosya_adi)
            self.play_queue.put(dosya_adi)                             # Kuyruğa ekle, thread oynatacak
            logging.info(f"Seslendirme kuyruğa eklendi: {metin}")
        except Exception as e:
            logging.error(f"Seslendirme hatası: {e}")

    def kapat(self):
        self.play_queue.put(None)   # Kuyruğu kapatmak için None gönder
        self.thread.join()          # Thread'in bitmesini bekle

# --- VERİTABANI SINIFI ---
class Veritabani:
    def __init__(self, config):
        self.conn = None
        self.cursor = None
        self.config = config
        self.baglan()               # Bağlantıyı hemen kur

    def baglan(self):
        try:
            conn_str = (
                f"Driver={self.config['driver']};"
                f"Server={self.config['server']};"
                f"Database={self.config['database']};"
                f"Trusted_Connection={self.config['trusted_connection']};"
            )
            self.conn = pyodbc.connect(conn_str)  # Bağlan
            self.cursor = self.conn.cursor()
            logging.info("Veritabanı bağlantısı başarılı.")
        except Exception as e:
            logging.error(f"Veritabanı bağlantı hatası: {e}")
            self.conn = None
            self.cursor = None

    def sorgula(self, sql, params=None):
        if self.cursor is None:
            logging.warning("Veritabanı bağlantısı yok, sorgu yapılamıyor.")
            return None
        try:
            if params:
                self.cursor.execute(sql, params)
            else:
                self.cursor.execute(sql)
            return self.cursor.fetchall()  # Sonuçları döndür
        except Exception as e:
            logging.error(f"Veritabanı sorgu hatası: {e}")
            return None

    def komut_calistir(self, sql, params=None):
        if self.cursor is None:
            logging.warning("Veritabanı bağlantısı yok, komut çalıştırılamıyor.")
            return False
        try:
            if params:
                self.cursor.execute(sql, params)
            else:
                self.cursor.execute(sql)
            self.conn.commit()
            return True
        except Exception as e:
            logging.error(f"Veritabanı komut hatası: {e}")
            return False

    def kapat(self):
        try:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()
            logging.info("Veritabanı bağlantısı kapatıldı.")
        except Exception as e:
            logging.error(f"Veritabanı kapatma hatası: {e}")

# --- SES TANIMA SINIFI ---
class SesTanima:
    def __init__(self):
        self.recognizer = sr.Recognizer()   # SpeechRecognition nesnesi

    def dinle(self, timeout=5, phrase_time_limit=10):
        with sr.Microphone() as kaynak:
            try:
                self.recognizer.adjust_for_ambient_noise(kaynak, duration=1)  # Ortam gürültüsünü ayarla
                print("Seni dinliyorum...")
                ses = self.recognizer.listen(kaynak, timeout=timeout, phrase_time_limit=phrase_time_limit)  # Dinle
                metin = self.recognizer.recognize_google(ses, language="tr-TR") # Google API ile tanı
                return metin.lower()
            except sr.WaitTimeoutError:
                return ""
            except sr.UnknownValueError:
                return ""
            except sr.RequestError as e:
                logging.error(f"Google Speech API hatası: {e}")
                return ""

# --- TARAYICI YÖNETİCİSİ ---
class TarayiciYonetici:
    def __init__(self, browser='edge'):
        self.browser = browser.lower()
        self.driver = None

    def ac(self, url):
        try:
            if self.driver is None:
                if self.browser == 'edge':
                    self.driver = webdriver.Edge(service=EdgeService())
                elif self.browser == 'chrome':
                    self.driver = webdriver.Chrome(service=ChromeService())
                elif self.browser == 'firefox':
                    self.driver = webdriver.Firefox(service=FirefoxService())
                else:
                    logging.warning("Desteklenmeyen tarayıcı, Edge kullanılacak.")
                    self.driver = webdriver.Edge(service=EdgeService())
                logging.info(f"{self.browser} tarayıcısı başlatıldı.")
            self.driver.get(url)  # URL'yi aç
            logging.info(f"{url} açıldı.")
        except WebDriverException as e:
            logging.error(f"Tarayıcı açma hatası: {e}")

    def kapat(self):
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
                logging.info("Tarayıcı kapatıldı.")
        except Exception as e:
            logging.error(f"Tarayıcı kapatma hatası: {e}")

# --- ANA ASİSTAN SINIFI ---
class ElionAsistan:
    def __init__(self):
        self.ses_oynatici = SesOynatici()       # Ses çıkışı için
        self.veritabani = Veritabani(DATABASE_CONFIG) # Veritabanı bağlantısı
        self.ses_tanima = SesTanima()            # Ses tanıma
        self.tarayici = TarayiciYonetici(browser=WEBDRIVER_BROWSER)  # Web tarayıcı yönetimi
        self.running = True

        # Komut listeleri (kullanıcının söyleyebileceği farklı ifadeler)
        self.tepki1 = ["merhaba", "merhaba elion", "elion", "hey elion"]  # Selamlaşma
        self.tepki2 = ["nasılsın elion", "bugün nasılsın", "keyifler nasıl kral", "ne haber lan", "nasılsın"]  # Hal hatır
        self.tepki3 = ["youtube bağlan", "bana şarkı aç", "şarkı aç", "youtube", "elion bana bir şarkı aç hele", "elion şarkı aç"]  # Youtube aç
        self.tepki4 = ["elion googleye bağlan", "acil googleye bağlan", "googleyi aç", "internete bağlan", "arama yap"]  # Google arama
        self.kitap_komutlari = ["elion bana kitap öner", "kitap öner", "bana bir kitap öner", "kitap tavsiye et"]  # Kitap öneri
        self.yeniden_kitap = ["başka öner", "tekrar", "beğenmedim", "yenisini öner"]  # Kitap önerisini yenileme
        self.film_komutlari = ["elion bana film öner", "film öner", "bana bir film öner", "film tavsiye et"]  # Film öneri
        self.yeniden_film = ["başka öner", "tekrar", "beğenmedim", "yenisini öner"]  # Film önerisini yenileme
        self.hatirlatma_komutlari = ["hatırlat", "hatırlatma ekle", "bir şey hatırlat", "bana hatırlatma kur"]  # Hatırlatma kurma
        self.gunluk_komutlari = ["günlük yaz", "günlüğe not ekle", "bugünkü notum", "günlük"]  # Günlük not yazma
        self.durdur_komutlari = ["durdur", "kapat", "dur", "bitir", "kalk"]  # Asistan kapatma komutları
        self.iptal_komutlari = ["iptal", "vazgeç", "dur artık", "hayır"]  # İşlemi iptal etme

    def seslendir(self, metin):
        # Metni sesli oynatmaya verir
        self.ses_oynatici.seslendir(metin)

    def mikrofon(self):
        # Mikrofon ile dinle ve anlamaya çalış
        metin = self.ses_tanima.dinle()
        if metin == "":
            # Eğer anlamazsa kullanıcıya söyler (burada hata olarak düşürmüyoruz, sadece bilgilendiriyoruz)
            self.seslendir("Seni anlayamadım, lütfen tekrar eder misin?")
        return metin

    def kitap_oner(self):
        # Veritabanından rastgele kitap önerir, kullanıcı isteyene kadar devam eder
        if self.veritabani.cursor is None:
            self.seslendir("Veritabanına bağlanılamıyor, kitap öneremem.")
            return
        while True:
            kitaplar = self.veritabani.sorgula("SELECT * FROM kitaplar")
            if kitaplar:
                secilen = random.choice(kitaplar)
                kitap_ad = secilen[1] if len(secilen) > 1 else "Bilinmeyen Kitap"
                self.seslendir(f"Sana önerim: {kitap_ad}")
                cevap = self.mikrofon()
                if cevap not in self.yeniden_kitap:
                    break
            else:
                self.seslendir("Veritabanında kitap bulunamadı.")
                break

    def film_oner(self):
        # Veritabanından rastgele film önerir, kullanıcı isteyene kadar devam eder
        if self.veritabani.cursor is None:
            self.seslendir("Veritabanına bağlanılamıyor, film öneremem.")
            return
        while True:
            filmler = self.veritabani.sorgula("SELECT * FROM filmler")
            if filmler:
                secilen = random.choice(filmler)
                film_ad = secilen[1] if len(secilen) > 1 else "Bilinmeyen film"
                self.seslendir(f"Sana önerim: {film_ad}")
                cevap = self.mikrofon()
                if cevap not in self.yeniden_film:
                    break
            else:
                self.seslendir("Veritabanında film bulunamadı.")
                break

    def hatirlatma_ekle(self):
        # Kullanıcıdan hatırlatma metni ve zamanı alıp veritabanına kaydeder
        self.seslendir("Ne hatırlatmamı istersin?")
        metin = self.mikrofon()
        if metin in self.iptal_komutlari:
            self.seslendir("Hatırlatma ekleme iptal edildi.")
            return

        self.seslendir("Ne zaman hatırlatayım? Örnek: 2025-05-08 14:30")
        zaman = self.mikrofon()
        if zaman in self.iptal_komutlari:
            self.seslendir("Hatırlatma ekleme iptal edildi.")
            return

        try:
            tarih_saat = datetime.strptime(zaman, "%Y-%m-%d %H:%M")  # Tarih formatı kontrolü
            sql = "INSERT INTO hatirlatmalar (metin, tarih_saat) VALUES (?, ?)"
            if self.veritabani.komut_calistir(sql, (metin, tarih_saat)):
                self.seslendir("Hatırlatma kaydedildi.")
            else:
                self.seslendir("Hatırlatma kaydedilirken hata oluştu.")
        except ValueError:
            self.seslendir("Tarihi anlayamadım. Lütfen formatı doğru gir.")

    def hatirlatmalari_kontrol_et(self):
        # Veritabanında zamanı gelen hatırlatmaları kontrol eder ve seslendirir, sonra siler
        if self.veritabani.cursor is None:
            return
        now = datetime.now()
        sql = "SELECT * FROM hatirlatmalar WHERE tarih_saat <= ?"
        hatirlatmalar = self.veritabani.sorgula(sql, (now,))
        if hatirlatmalar:
            for h in hatirlatmalar:
                self.seslendir("Hatırlatma: " + h[1])
                self.veritabani.komut_calistir("DELETE FROM hatirlatmalar WHERE id = ?", (h[0],))

    def gunluk_ekle(self):
        # Günlük notu kullanıcıdan alıp veritabanına kaydeder
        self.seslendir("Bugünkü günlüğünü söyle.")
        metin = self.mikrofon()
        if metin in self.iptal_komutlari:
            self.seslendir("Günlük kaydı iptal edildi.")
            return
        tarih = datetime.now().date()
        sql = "INSERT INTO gunluk (tarih, metin) VALUES (?, ?)"
        if self.veritabani.komut_calistir(sql, (tarih, metin)):
            self.seslendir("Günlük kaydedildi.")
        else:
            self.seslendir("Günlük kaydedilirken hata oluştu.")

    def youtube_ac(self):
        # Youtube'da şarkı aratır ve tarayıcıda açar
        self.seslendir("Hangi şarkıyı açmamı istersin?")
        cevap = self.mikrofon()
        if cevap in self.iptal_komutlari or cevap == "":
            self.seslendir("İptal edildi.")
            return
        url = "https://www.youtube.com/results?search_query=" + cevap.replace(" ", "+")
        self.tarayici.ac(url)
        self.seslendir(f"{cevap} için YouTube'da arama yapılıyor.")

    def google_arama(self):
        # Google'da arama yapar ve tarayıcıda açar
        self.seslendir("Ne aramamı istersin?")
        cevap = self.mikrofon()
        if cevap in self.iptal_komutlari or cevap == "":
            self.seslendir("İptal edildi.")
            return
        url = "https://www.google.com/search?q=" + cevap.replace(" ", "+")
        self.tarayici.ac(url)
        self.seslendir("Bulduğum içerikler açılıyor.")

    def ses_karsilikli(self, gelen_ses):
        # Gelen ses komutunu analiz edip karşılık verir
        if gelen_ses in self.durdur_komutlari:
            self.seslendir("Görüşürüz, kendine iyi bak!")
            self.tarayici.kapat()
            self.running = False
            self.ses_oynatici.kapat()
            self.veritabani.kapat()
            return

        if gelen_ses in self.tepki1:
            self.seslendir("Merhaba efendim, hoş geldin!")
        elif gelen_ses in self.tepki2:
            self.seslendir("İyiyim efendim, sen nasılsın?")
        elif gelen_ses in self.tepki3:
            self.youtube_ac()
        elif gelen_ses in self.tepki4:
            self.google_arama()
        elif gelen_ses in self.kitap_komutlari:
            self.kitap_oner()
        elif gelen_ses in self.film_komutlari:
            self.film_oner()
        elif gelen_ses in self.hatirlatma_komutlari:
            self.hatirlatma_ekle()
        elif gelen_ses in self.gunluk_komutlari:
            self.gunluk_ekle()
        else:
            # Anlaşılamayan komutlarda bu mesajı seslendir
            self.seslendir("Bu komutu anlayamadım, lütfen tekrar eder misin?")

    def calistir(self):
        # Ana döngü, asistan çalışır ve dinler
        self.seslendir("Elion aktif, seni dinliyorum.")
        while self.running:
            try:
                self.hatirlatmalari_kontrol_et()  # Zamanı gelmiş hatırlatmaları oku
                gelen_ses = self.ses_tanima.dinle()  # Kullanıcı sesi al
                if gelen_ses:
                    print(f"Kullanıcı: {gelen_ses}")
                    self.ses_karsilikli(gelen_ses)  # Komutu işle
                else:
                    # Ses algılanmazsa 0.5 saniye bekle ve döngüyü devam ettir
                    time.sleep(0.5)
            except KeyboardInterrupt:
                self.seslendir("Görüşürüz!")
                break
            except Exception as e:
                logging.error(f"Genel hata: {e}")
                self.seslendir("Bir hata oluştu, lütfen tekrar dene.")

        # Program kapanırken kaynakları temizle
        self.tarayici.kapat()
        self.ses_oynatici.kapat()
        self.veritabani.kapat()
        logging.info("Asistan kapandı.")

if __name__ == "__main__":
    asistan = ElionAsistan()
    asistan.calistir()
