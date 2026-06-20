from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db
from routers import companies, jobs, search, outreach


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="YC Job Dashboard API",
    description="Job dashboard for YC companies with AI-powered search",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(outreach.router, prefix="/api/outreach", tags=["outreach"])


@app.get("/api/stats")
async def get_stats():
    from database import get_db

    db = await get_db()
    try:
        stats = {}

        cursor = await db.execute("SELECT COUNT(*) FROM companies")
        stats["total_companies"] = (await cursor.fetchone())[0]

        cursor = await db.execute("SELECT COUNT(*) FROM companies WHERE is_hiring = 1")
        stats["hiring_companies"] = (await cursor.fetchone())[0]

        cursor = await db.execute("SELECT COUNT(*) FROM jobs")
        stats["total_jobs"] = (await cursor.fetchone())[0]

        cursor = await db.execute("SELECT COUNT(*) FROM founders")
        stats["total_founders"] = (await cursor.fetchone())[0]

        cursor = await db.execute("SELECT tier, COUNT(*) FROM jobs GROUP BY tier")
        stats["jobs_by_tier"] = {row[0]: row[1] for row in await cursor.fetchall()}

        cursor = await db.execute(
            "SELECT batch, COUNT(*) FROM companies GROUP BY batch ORDER BY batch DESC LIMIT 10"
        )
        stats["companies_by_batch"] = {
            row[0]: row[1] for row in await cursor.fetchall()
        }

        return stats
    finally:
        await db.close()


@app.get("/api/health")
async def health():
    return {"status": "ok"}
