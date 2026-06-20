from fastapi import APIRouter, Query
from typing import Optional
from database import get_db

router = APIRouter()


@router.get("")
async def list_companies(
    batch: Optional[str] = None,
    industry: Optional[str] = None,
    is_hiring: Optional[bool] = None,
    top_company: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    db = await get_db()
    try:
        query = "SELECT * FROM companies WHERE 1=1"
        params = []

        if batch:
            query += " AND batch = ?"
            params.append(batch)
        if industry:
            query += " AND industry = ?"
            params.append(industry)
        if is_hiring is not None:
            query += " AND is_hiring = ?"
            params.append(1 if is_hiring else 0)
        if top_company is not None:
            query += " AND top_company = ?"
            params.append(1 if top_company else 0)
        if search:
            query += " AND (name LIKE ? OR description LIKE ? OR one_liner LIKE ?)"
            params.extend([f"%{search}%"] * 3)

        count_query = query.replace("SELECT *", "SELECT COUNT(*)")
        cursor = await db.execute(count_query, params)
        total = (await cursor.fetchone())[0]

        query += " ORDER BY name LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "companies": [dict(row) for row in rows],
        }
    finally:
        await db.close()


@router.get("/batches")
async def list_batches():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT batch, COUNT(*) as count FROM companies GROUP BY batch ORDER BY batch DESC"
        )
        rows = await cursor.fetchall()
        return [{"batch": row[0], "count": row[1]} for row in rows]
    finally:
        await db.close()


@router.get("/industries")
async def list_industries():
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT industry, COUNT(*) as count FROM companies WHERE industry IS NOT NULL GROUP BY industry ORDER BY count DESC"
        )
        rows = await cursor.fetchall()
        return [{"industry": row[0], "count": row[1]} for row in rows]
    finally:
        await db.close()


@router.get("/{slug}")
async def get_company(slug: str):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM companies WHERE slug = ?", (slug,))
        company = await cursor.fetchone()
        if not company:
            return {"error": "Company not found"}

        company_dict = dict(company)

        cursor = await db.execute(
            "SELECT * FROM founders WHERE company_id = ?", (company_dict["id"],)
        )
        founders = await cursor.fetchall()
        company_dict["founders"] = [dict(f) for f in founders]

        cursor = await db.execute(
            "SELECT * FROM jobs WHERE company_id = ? ORDER BY posted_at DESC",
            (company_dict["id"],),
        )
        jobs_list = await cursor.fetchall()
        company_dict["jobs"] = [dict(j) for j in jobs_list]

        return company_dict
    finally:
        await db.close()
