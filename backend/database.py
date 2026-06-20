import aiosqlite
import os

DB_PATH = os.getenv("DB_PATH", "yc_dashboard.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    long_description TEXT,
    url TEXT,
    batch TEXT,
    status TEXT,
    industry TEXT,
    subindustry TEXT,
    team_size INTEGER,
    website TEXT,
    logo_url TEXT,
    top_company BOOLEAN DEFAULT 0,
    is_hiring BOOLEAN DEFAULT 0,
    regions TEXT,
    tags TEXT,
    one_liner TEXT,
   yc_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS founders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    external_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    remote BOOLEAN DEFAULT 0,
    salary_min REAL,
    salary_max REAL,
    salary_currency TEXT DEFAULT 'USD',
    department TEXT,
    employment_type TEXT,
    source TEXT,
    source_url TEXT,
    tier TEXT DEFAULT 'T3',
    reply_probability REAL DEFAULT 0.0,
    posted_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS outreach_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    founder_id INTEGER,
    company_id INTEGER,
    note TEXT NOT NULL,
    status TEXT DEFAULT 'not_sent',
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (founder_id) REFERENCES founders(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

CREATE TABLE IF NOT EXISTS job_embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    embedding BLOB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tier ON jobs(tier);
CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs(posted_at);
CREATE INDEX IF NOT EXISTS idx_founders_company ON founders(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_batch ON companies(batch);
CREATE INDEX IF NOT EXISTS idx_companies_hiring ON companies(is_hiring);
"""


async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    db = await aiosqlite.connect(DB_PATH)
    await db.executescript(SCHEMA)
    await db.commit()
    await db.close()


async def seed_initial_data():
    """Check if DB has data, if not run ingestion."""
    db = await aiosqlite.connect(DB_PATH)
    cursor = await db.execute("SELECT COUNT(*) FROM companies")
    count = (await cursor.fetchone())[0]
    await db.close()
    return count == 0
