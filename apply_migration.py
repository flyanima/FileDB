import os
import psycopg2

# Configuration
DB_HOST = "db.cycsyhpsnythvjtjedhn.supabase.co"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres" # Pooler often requires [user].[project_ref] format, but for Supabase it's usually just postgres or postgres.[ref]
# Actually for Supabase pooler, user is usually postgres.[project_ref]
# Let's try the standard user first, if fails, I might need to adjust.
# But the connection string usually has user=postgres.
# Wait, for pooler, the user is `postgres.cycsyhpsnythvjtjedhn` usually?
# Let's check standard Supabase docs mentally.
# Connection string: postgres://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres
# User is `postgres.[ref]`.
# Ref is `cycsyhpsnythvjtjedhn`.
DB_USER = "postgres.cycsyhpsnythvjtjedhn"
DB_PASSWORD = "8840557Jcy@"

MIGRATION_FILE = "supabase/migrations/20251125_phase2_documents.sql"

def apply_migration():
    try:
        # Connect to the database
        print(f"Connecting to {DB_HOST} on port {DB_PORT}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        # Read SQL file
        print(f"Reading migration file: {MIGRATION_FILE}")
        with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Execute SQL
        print("Executing SQL...")
        cur.execute(sql_content)
        
        print("Migration applied successfully!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error applying migration: {e}")
        exit(1)

if __name__ == "__main__":
    apply_migration()
