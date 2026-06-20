from fastapi import APIRouter, Query
from typing import Optional
from database import get_db

router = APIRouter()


@router.get("")
async def list_jobs(
    batch: Optional[str] = None,
    tier: Optional[str] = None,
    remote: Optional[bool] = None,
    search: Optional[str] = None,
    company: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    db = await get_db()
    try:
        query = """
            SELECT j.*, c.name as company_name, c.slug as company_slug, c.batch, c.logo_url
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE 1=1
        """
        params = []

        if batch:
            query += " AND c.batch = ?"
            params.append(batch)
        if tier:
            query += " AND j.tier = ?"
            params.append(tier)
        if remote is not None:
            query += " AND j.remote = ?"
            params.append(1 if remote else 0)
        if search:
            query += " AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?)"
            params.extend([f"%{search}%"] * 3)
        if company:
            query += " AND c.slug = ?"
            params.append(company)

        count_query = query.replace("SELECT j.*, c.name as company_name, c.slug as company_slug, c.batch, c.logo_url", "SELECT COUNT(*)")
        cursor = await db.execute(count_query, params)
        total = (await cursor.fetchone())[0]

        query += " ORDER BY j.posted_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "jobs": [dict(row) for row in rows],
        }
    finally:
        await db.close()


@router.get("/{job_id}")
async def get_job(job_id: int):
    db = await get_db()
    try:
        cursor = await db.execute(
            """
            SELECT j.*, c.name as company_name, c.slug as company_slug, c.batch
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE j.id = ?
            """,
            (job_id,),
        )
        job = await cursor.fetchone()
        if not job:
            return {"error": "Job not found"}
        return dict(job)
    finally:
        await db.close()
