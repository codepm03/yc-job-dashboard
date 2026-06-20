#!/usr/bin/env python3
"""Ingest all data sources into the database."""
import asyncio
import sys
import os

# Add backend directory to path
backend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend")
sys.path.insert(0, backend_dir)

from database import init_db
from services.yc_ingest import ingest_yc_companies
from services.ats_ingest import ingest_jobs


async def main():
    print("=" * 60)
    print("YC Job Dashboard - Data Ingestion")
    print("=" * 60)

    await init_db()
    print("\n[1/2] Ingesting YC companies...")
    result1 = await ingest_yc_companies()

    print("\n[2/2] Ingesting job listings...")
    result2 = await ingest_jobs()

    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Companies: {result1['inserted']} new, {result1['updated']} updated")
    print(f"  Jobs: {result2['inserted']} inserted, {result2['skipped']} skipped")
    print("=" * 60)

    # Optional: compute embeddings
    if "--embed" in sys.argv:
        print("\n[Extra] Computing job embeddings...")
        from services.embedding import compute_job_embeddings
        await compute_job_embeddings()
        print("Embeddings done!")


if __name__ == "__main__":
    asyncio.run(main())
