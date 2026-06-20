from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    limit: int = 20


@router.post("")
async def search_jobs(req: SearchRequest):
    db = await get_db()
    try:
        query = """
            SELECT j.*, c.name as company_name, c.slug as company_slug, c.batch, c.logo_url
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ?
            ORDER BY j.posted_at DESC
            LIMIT ?
        """
        params = [f"%{req.query}%"] * 3 + [req.limit]
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()

        return {
            "query": req.query,
            "results": [dict(row) for row in rows],
            "count": len(rows),
        }
    finally:
        await db.close()


@router.post("/semantic")
async def semantic_search(req: SearchRequest):
    """Semantic search using embeddings (requires pre-computed embeddings)."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT COUNT(*) FROM job_embeddings")
        count = (await cursor.fetchone())[0]

        if count == 0:
            return {
                "query": req.query,
                "results": [],
                "message": "No embeddings found. Run: python -m services.embedding",
            }

        from services.embedding import get_query_embedding, cosine_similarity
        import numpy as np

        query_emb = await get_query_embedding(req.query)

        cursor = await db.execute("SELECT job_id, embedding FROM job_embeddings")
        rows = await cursor.fetchall()

        scored = []
        for row in rows:
            emb = np.frombuffer(row[1], dtype=np.float32)
            score = cosine_similarity(query_emb, emb)
            scored.append((row[0], score))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_job_ids = [s[0] for s in scored[:req.limit]]

        if not top_job_ids:
            return {"query": req.query, "results": [], "count": 0}

        placeholders = ",".join("?" * len(top_job_ids))
        cursor = await db.execute(
            f"""
            SELECT j.*, c.name as company_name, c.slug as company_slug, c.batch, c.logo_url
            FROM jobs j
            LEFT JOIN companies c ON j.company_id = c.id
            WHERE j.id IN ({placeholders})
            """,
            top_job_ids,
        )
        rows = await cursor.fetchall()
        results = [dict(row) for row in rows]

        id_to_result = {r["id"]: r for r in results}
        ordered = [id_to_result[jid] for jid in top_job_ids if jid in id_to_result]

        return {
            "query": req.query,
            "results": ordered,
            "count": len(ordered),
        }
    finally:
        await db.close()
