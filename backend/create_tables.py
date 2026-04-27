import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'localhost'),
    port=os.getenv('DB_PORT', '5432'),
    database=os.getenv('DB_NAME', 'elion'),
    user=os.getenv('DB_USER', 'postgres'),
    password=os.getenv('DB_PASS', 'postgres')
)
cursor = conn.cursor()

tablolar = [
    """
    CREATE TABLE IF NOT EXISTS kitaplar (
        id SERIAL PRIMARY KEY,
        ad VARCHAR(255) NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS filmler (
        id SERIAL PRIMARY KEY,
        ad VARCHAR(255) NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS hatirlatmalar (
        id SERIAL PRIMARY KEY,
        metin VARCHAR(500) NOT NULL,
        tarih_saat TIMESTAMP NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS gunluk (
        id SERIAL PRIMARY KEY,
        tarih DATE NOT NULL,
        metin TEXT NOT NULL
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS sohbet_gecmisi (
        id SERIAL PRIMARY KEY,
        kimden VARCHAR(50) NOT NULL,
        mesaj TEXT NOT NULL,
        zaman TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """
]

for sql in tablolar:
    cursor.execute(sql)
    conn.commit()

print("✅ Tüm PostgreSQL tabloları başarıyla oluşturuldu!")
conn.close()