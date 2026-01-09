import requests
import psycopg2
from psycopg2 import extras
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv()

API_KEY = os.getenv("API_KEY", "579b464db66ec23bdd000001df45da81e3134987623cf97c024f6d86")
RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
BASE_URL = f"https://api.data.gov.in/resource/{RESOURCE_ID}"

# Database config
DB_NAME = os.getenv("DB_NAME", "SmartAgriDB")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

def create_database_if_not_exists():
    """Calculates if the database exists and creates it if not."""
    try:
        # Connect to default 'postgres' database to check/create target DB
        conn = psycopg2.connect(
            dbname='postgres',
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Check if DB exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
        exists = cur.fetchone()
        
        if not exists:
            print(f"Database '{DB_NAME}' not found. Creating it...")
            cur.execute(f'CREATE DATABASE "{DB_NAME}"')
            print(f"Database '{DB_NAME}' created successfully.")
        else:
            print(f"Database '{DB_NAME}' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Warning: Could not check/create database: {e}")
        print("Will attempt to connect directly.")

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        return conn
    except psycopg2.OperationalError as e:
        print(f"OperationalError connecting to database '{DB_NAME}': {e}")
        return None
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def create_table_if_not_exists(conn):
    query = """
    CREATE TABLE IF NOT EXISTS market_prices (
        id SERIAL PRIMARY KEY,
        state TEXT,
        district TEXT,
        market TEXT,
        commodity TEXT,
        variety TEXT,
        grade TEXT,
        arrival_date DATE,
        min_price NUMERIC,
        max_price NUMERIC,
        modal_price NUMERIC,
        UNIQUE(state, district, market, commodity, variety, arrival_date)
    );
    """
    try:
        with conn.cursor() as cur:
            # Drop table to ensure clean schema (development mode helper)
            cur.execute("DROP TABLE IF EXISTS market_prices")
            cur.execute(query)
        conn.commit()
    except Exception as e:
        print(f"Error creating table: {e}")
        conn.rollback()

def insert_market_data(conn, records):
    """
    Takes a list of record dictionaries from the API and inserts them into the market_prices table.
    """
    if not records:
        return 0

    rows_to_insert = []
    
    for rec in records:
        date_str = rec.get('arrival_date', '')
        try:
            # Format is usually DD/MM/YYYY from data.gov.in
            dt = datetime.strptime(date_str, "%d/%m/%Y").date()
        except ValueError:
            # Skip invalid dates
            continue
            
        rows_to_insert.append((
            rec.get('state'),
            rec.get('district'),
            rec.get('market'),
            rec.get('commodity'),
            rec.get('variety'),
            rec.get('grade'),
            dt,
            rec.get('min_price'),
            rec.get('max_price'),
            rec.get('modal_price')
        ))
    
    if not rows_to_insert:
        return 0

    try:
        with conn.cursor() as cur:
            # We use ON CONFLICT DO NOTHING to avoid duplicate errors on re-runs
            query = """
            INSERT INTO market_prices 
            (state, district, market, commodity, variety, grade, arrival_date, min_price, max_price, modal_price)
            VALUES %s
            ON CONFLICT (state, district, market, commodity, variety, arrival_date) DO NOTHING;
            """
            extras.execute_values(cur, query, rows_to_insert)
        conn.commit()
        return len(rows_to_insert)
    except Exception as e:
        print(f"Error inserting data: {e}")
        conn.rollback()
        return 0

def fetch_and_process():
    # Attempt to create DB first
    create_database_if_not_exists()
    
    conn = get_db_connection()
    if not conn:
        print("Aborting script due to connection failure.")
        return

    create_table_if_not_exists(conn)

    limit = 1000
    offset = 0
    cutoff_date = (datetime.now() - timedelta(days=365*2)).date()
    
    print(f"Fetching data from API since {cutoff_date}...")

    more_data = True
    total_inserted = 0
    
    while more_data:
        print(f"Fetching offset {offset}...")
        params = {
            "api-key": API_KEY,
            "format": "json",
            "limit": limit,
            "offset": offset
        }
        
        try:
            resp = requests.get(BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            
            records = data.get('records', [])
            if not records:
                print("No more records returned by API.")
                break
            
            # Check dates to stop if we go too far back (assuming roughly newer to older, 
            # though API sort isn't guaranteed, we process all but stop if explicitly older block)
            # Actually, without sort param, order is potentially random or insertion order. 
            # We will process everything in the block.
            
            # Use our new function to insert
            inserted_count = insert_market_data(conn, records)
            total_inserted += inserted_count
            print(f"Batch processed. Inserted: {inserted_count}. Total: {total_inserted}")

            if len(records) < limit:
                more_data = False
            
            # Simple check if the LAST record in this batch is super old to break early
            # This relies on the API returning data somewhat chronologically descending
            if records:
                try:
                    last_date = datetime.strptime(records[-1].get('arrival_date', ''), "%d/%m/%Y").date()
                    if last_date < cutoff_date:
                        print("Reached data older than cutoff. Stopping.")
                        break
                except:
                    pass

            offset += limit
            time.sleep(0.5)

        except Exception as e:
            print(f"Error during fetch/process: {e}")
            break

    conn.close()
    print("Market price sync complete.")

if __name__ == "__main__":
    fetch_and_process()
