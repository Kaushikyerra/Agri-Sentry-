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

print("\n--- Unique States ---")
df_states = pd.read_sql("SELECT DISTINCT state FROM market_prices ORDER BY state", conn)
print(df_states['state'].tolist())

print("\n--- Unique Commodities (Sample) ---")
df_comm = pd.read_sql("SELECT DISTINCT commodity FROM market_prices ORDER BY commodity LIMIT 50", conn)
print(df_comm['commodity'].tolist())

print("\n--- Check Data for 'Tomato' ---")
df_tomato = pd.read_sql("SELECT state, district, market, COUNT(*) FROM market_prices WHERE commodity ILIKE '%Tomato%' GROUP BY state, district, market ORDER BY COUNT(*) DESC LIMIT 10", conn)
print(df_tomato)

print("\n--- Check Data for 'Chilli' ---")
df_chilli = pd.read_sql("SELECT state, district, market, commodity, COUNT(*) FROM market_prices WHERE commodity ILIKE '%Chilli%' GROUP BY state, district, market, commodity ORDER BY COUNT(*) DESC LIMIT 10", conn)
print(df_chilli)

conn.close()
