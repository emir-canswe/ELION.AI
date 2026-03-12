import pyodbc
from dotenv import load_dotenv
import os

load_dotenv()

conn_str = (
    f"Driver={os.getenv('DB_DRIVER')};"
    f"Server={os.getenv('DB_SERVER')};"
    f"Database={os.getenv('DB_DATABASE')};"
    f"Trusted_Connection={os.getenv('DB_TRUSTED_CONNECTION')};"
)

conn = pyodbc.connect(conn_str)
cursor = conn.cursor()

tablolar = [
    """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='kitaplar')
    CREATE TABLE kitaplar (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ad NVARCHAR(255) NOT NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='filmler')
    CREATE TABLE filmler (
        id INT IDENTITY(1,1) PRIMARY KEY,
        ad NVARCHAR(255) NOT NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hatirlatmalar')
    CREATE TABLE hatirlatmalar (
        id INT IDENTITY(1,1) PRIMARY KEY,
        metin NVARCHAR(500) NOT NULL,
        tarih_saat DATETIME NOT NULL
    )
    """,
    """
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='gunluk')
    CREATE TABLE gunluk (
        id INT IDENTITY(1,1) PRIMARY KEY,
        tarih DATE NOT NULL,
        metin NVARCHAR(MAX) NOT NULL
    )
    """
]

for sql in tablolar:
    cursor.execute(sql)
    conn.commit()

print("✅ Tüm tablolar başarıyla oluşturuldu!")
conn.close()