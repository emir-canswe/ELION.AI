from gtts import gTTS  # Metni sese çevirmek için Google Text-to-Speech modülü
import speech_recognition as sr  # Konuşmayı yazıya dökmek için SpeechRecognition modülü
import random  # Rastgele sayı üretmek için
import os  # Dosya işlemleri için
import pygame  # Ses dosyasını çalmak için
from selenium import webdriver  # Tarayıcı işlemleri için
from selenium.webdriver.common.by import By
import time  # Bekleme işlemleri için

# **Sesleri tanıyabilmek için SpeechRecognition nesnesi oluşturuyoruz**
r = sr.Recognizer()

# **Kullanıcının verebileceği bazı sesli komutlar**
tepki1 = ["merhaba", "merhaba epsema", "epsema", "hey epsema"]  # Selam komutları
tepki2 = ["nasılsın epsema", "bugün nasılsın", "keyifler nasıl kral", "ne haber lan", "nasılsın"]  # Hal hatır sorma
tepki3 = ["youtube bağlan", "bana şarkı aç", "şarkı aç", "youtube", "epsema bana bir şarkı aç hele", "epsema şarkı aç"]  # YouTube komutları
tepki4 = ["epsema googleye bağlan", "acil googleye bağlan", "googleyi aç", "internete bağlan", "arama yap"]  # Google arama komutları


# **Sesli Asistan Sınıfı**
class SesliAsistan:
    def __init__(self):
        pygame.mixer.init()  # pygame başlat





    # **Metni sese dönüştüren fonksiyon**
    def seslendirme(self, metin):
        """Verilen metni sesli olarak okur."""
        dosya = str(random.randint(0, 1000000000)) + ".mp3"  # Rastgele isimde bir ses dosyası oluştur
        metin_seslendirme = gTTS(text=metin, lang="tr", slow=False)  # Metni sese çevir
        metin_seslendirme.save(dosya)  # Ses dosyasını kaydet

        pygame.mixer.music.load(dosya)  # Ses dosyasını yükle
        pygame.mixer.music.play()  # Ses dosyasını oynat

        while pygame.mixer.music.get_busy():  # Ses çalarken bekle
            continue
        pygame.mixer.music.unload()  # Oynatılan dosyayı bellekten çıkar
        os.remove(dosya)  # Dosyayı silerek yer aç





    # **Mikrofonla konuşmayı algılayan fonksiyon**
    def mikrofon(self):
        """Mikrofondan ses alır ve yazıya çevirir."""
        with sr.Microphone() as kaynak:  # Mikrofonu giriş kaynağı olarak belirle
            r.adjust_for_ambient_noise(kaynak, duration=1)  # Gürültüyü azaltma
            print("Seni dinliyorum ...")
            listen = r.listen(kaynak)  # Mikrofondan gelen sesi dinle
            try:
                ses = r.recognize_google(listen, language="tr-TR")  # Konuşmayı yazıya dök
                return ses.lower()  # Küçük harfe çevirerek döndür
            except sr.UnknownValueError:  # Eğer ses anlaşılamazsa
                self.seslendirme("Ne dediğini anlamadım efendim.")  # Hata mesajı ver
                return ""  # Boş döndür





    # **Sesli asistanın kullanıcıya cevap vermesini sağlayan fonksiyon**
    def ses_karsilikli(self, gelen_Ses):
        """Gelen sesi analiz eder ve uygun yanıtı verir."""
        if gelen_Ses in tepki1:  # Selam verilirse
            self.seslendirme("Merhaba efendim, hoş geldin!")
        
        
        elif gelen_Ses in tepki2:  # Hal hatır sorulursa
            self.seslendirme("İyiyim efendim, sen nasılsın?")
        
        
        
        
        elif gelen_Ses in tepki3:  # YouTube komutu gelirse
            self.seslendirme("Bağlanıyorum efendim.")
            cevap = self.mikrofon()  # Kullanıcıdan şarkı ismi al
            if cevap:  # Eğer bir şarkı ismi girdiyse
                url = "https://www.youtube.com/results?search_query=" + cevap  # YouTube arama linki oluştur
                tarayici = webdriver.Edge()  # Edge WebDriver başlat
                tarayici.get(url)  # YouTube'da arama yap
                time.sleep(5)  # Sayfanın yüklenmesini bekle
                tarayici.quit()  # Tarayıcıyı kapat



        elif gelen_Ses in tepki4:  # Google araması yapılacaksa
            self.seslendirme("Ne aramamı istersiniz?")
            cevap = self.mikrofon()  # Mikrofondan arama yapılacak kelimeyi al
            if cevap:
                url = "https://www.google.com/search?q=" + cevap  # Google arama linki oluştur
                self.seslendirme("Bulduğum içerikler bunlar.")
                tarayici = webdriver.Edge()  # Edge WebDriver başlat
                tarayici.get(url)  # Arama yap
                time.sleep(5)  # Bekle
                tarayici.quit()  # Tarayıcıyı kapat





# **Asistanı çalıştırma**
asistan = SesliAsistan()  # Sesli asistan nesnesini oluştur

while True:  # Sonsuz döngü, asistan sürekli dinlemeye devam edecek
    gelen_Ses = asistan.mikrofon()  # Mikrofondan gelen sesi al
    if gelen_Ses:  # Eğer boş değilse
        print(f"Kullanıcı: {gelen_Ses}")  # Kullanıcının söylediğini ekrana yazdır
        asistan.ses_karsilikli(gelen_Ses)  # Gelen sesi analiz edip karşılık ver
