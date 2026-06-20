import asyncio
import numpy as np
from database import get_db, init_db

try:
    from sentence_transformers import SentenceTransformer
    MODEL = SentenceTransformer("all-MiniLM-L6-v2")
    USE_LOCAL = True
except ImportError:
    USE_LOCAL = False


def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    a = np.array(a, dtype=np.float32)
    b = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


async def get_query_embedding(text: str) -> np.ndarray:
    """Get embedding for a query."""
    if USE_LOCAL:
        return MODEL.encode(text)
    raise RuntimeError("No embedding model available. Install sentence-transformers.")


async def compute_job_embeddings():
    """Pre-compute embeddings for all jobs."""
    await init_db()
    db = await get_db()

    try:
        if not USE_LOCAL:
            print("sentence-transformers not installed. Run: pip install sentence-transformers")
            return

        cursor = await db.execute("SELECT id, title, description FROM jobs")
        jobs = await cursor.fetchall()
        print(f"Computing embeddings for {len(jobs)} jobs...")

        texts = []
        job_ids = []
        for job in jobs:
            text = f"{job[1] or ''} {job[2] or ''}"[:512]
            texts.append(text)
            job_ids.append(job[0])

        if not texts:
            print("No jobs found to embed.")
            return

        embeddings = MODEL.encode(texts, show_progress_bar=True)

        for job_id, emb in zip(job_ids, embeddings):
            emb_blob = emb.astype(np.float32).tobytes()
            cursor = await db.execute(
                "SELECT id FROM job_embeddings WHERE job_id = ?", (job_id,)
            )
            if await cursor.fetchone():
                await db.execute(
                    "UPDATE job_embeddings SET embedding = ? WHERE job_id = ?",
                    (emb_blob, job_id),
                )
            else:
                await db.execute(
                    "INSERT INTO job_embeddings (job_id, embedding) VALUES (?, ?)",
                    (job_id, emb_blob),
                )

        await db.commit()
        print(f"Done: {len(job_ids)} embeddings computed and stored.")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(compute_job_embeddings())
