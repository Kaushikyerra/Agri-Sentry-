import psycopg2
import os
from dotenv import load_dotenv
import pandas as pd

load_dotenv()

DB_NAME = os.getenv("DB_NAME", "SmartAgriDB")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASS,
    host=DB_HOST,
    port=DB_PORT
)

# Check distinct commodities
print("--- Top 20 Commodities ---")
df_comm = pd.read_sql("SELECT commodity, COUNT(*) as c FROM market_prices GROUP BY commodity ORDER BY c DESC LIMIT 20", conn)
print(df_comm)

# Check specific matches for 'Tomato'
print("\n--- Tomato Matches ---")
df_tomato = pd.read_sql("SELECT DISTINCT commodity FROM market_prices WHERE commodity ILIKE '%Tomato%'", conn)
print(df_tomato)

# Check specific matches for 'Chilli'
print("\n--- Chilli Matches ---")
df_chilli = pd.read_sql("SELECT DISTINCT commodity FROM market_prices WHERE commodity ILIKE '%Chilli%'", conn)
print(df_chilli)

# Check a sample full record
print("\n--- Sample Record ---")
df_sample = pd.read_sql("SELECT * FROM market_prices LIMIT 1", conn)
print(df_sample.transpose())

conn.close()
