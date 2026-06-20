from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import os
import asyncio

app = FastAPI(title="YC Job Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory data store (loaded on cold start)
_data = {"companies": [], "jobs": [], "loaded": False}

YC_API_BASE = "https://yc-oss.github.io/api"


async def load_data():
    """Load YC data from free API on cold start."""
    if _data["loaded"]:
        return

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Fetch companies
        try:
            resp = await client.get(f"{YC_API_BASE}/companies/all.json")
            companies = resp.json()
            _data["companies"] = companies
        except Exception:
            _data["companies"] = []

        # Fetch hiring companies for job context
        try:
            resp = await client.get(f"{YC_API_BASE}/companies/hiring.json")
            hiring = resp.json()
            for c in hiring:
                c["isHiring"] = True
            _data["hiring"] = {c.get("slug"): c for c in hiring}
        except Exception:
            _data["hiring"] = {}

    _data["loaded"] = True


@app.on_event("startup")
async def startup():
    await load_data()


@app.get("/api/health")
async def health():
    return {"status": "ok", "loaded": _data["loaded"]}


@app.get("/api/stats")
async def get_stats():
    companies = _data.get("companies", [])
    hiring = _data.get("hiring", {})

    batches = {}
    industries = {}
    hiring_count = 0

    for c in companies:
        batch = c.get("batch", "Unknown")
        batches[batch] = batches.get(batch, 0) + 1

        for ind in c.get("industries", []):
            industries[ind] = industries.get(ind, 0) + 1

        if c.get("slug") in hiring or c.get("isHiring"):
            hiring_count += 1

    top_batches = dict(sorted(batches.items(), key=lambda x: -x[1])[:10])
    top_industries = dict(sorted(industries.items(), key=lambda x: -x[1])[:10])

    return {
        "total_companies": len(companies),
        "hiring_companies": hiring_count,
        "total_jobs": 0,
        "total_founders": 0,
        "jobs_by_tier": {"T1": 0, "T2": 0, "T3": 0},
        "companies_by_batch": top_batches,
        "top_industries": top_industries,
    }


@app.get("/api/companies")
async def list_companies(
    batch: Optional[str] = None,
    industry: Optional[str] = None,
    is_hiring: Optional[bool] = None,
    top_company: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    companies = _data.get("companies", [])
    hiring = _data.get("hiring", {})

    filtered = companies

    if batch:
        filtered = [c for c in filtered if c.get("batch") == batch]
    if industry:
        filtered = [
            c for c in filtered if industry.lower() in [i.lower() for i in c.get("industries", [])]
        ]
    if is_hiring is not None:
        if is_hiring:
            filtered = [c for c in filtered if c.get("slug") in hiring or c.get("isHiring")]
        else:
            filtered = [c for c in filtered if c.get("slug") not in hiring and not c.get("isHiring")]
    if top_company is not None:
        filtered = [c for c in filtered if c.get("top_company") == top_company]
    if search:
        s = search.lower()
        filtered = [
            c
            for c in filtered
            if s in (c.get("name", "")).lower()
            or s in (c.get("one_liner", "")).lower()
            or s in (c.get("long_description", "")).lower()
        ]

    total = len(filtered)
    page = filtered[offset : offset + limit]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "companies": [_format_company(c, hiring) for c in page],
    }


@app.get("/api/companies/batches")
async def list_batches():
    companies = _data.get("companies", [])
    batches = {}
    for c in companies:
        b = c.get("batch", "Unknown")
        batches[b] = batches.get(b, 0) + 1
    return [{"batch": k, "count": v} for k, v in sorted(batches.items(), key=lambda x: -x[1])]


@app.get("/api/companies/industries")
async def list_industries():
    companies = _data.get("companies", [])
    industries = {}
    for c in companies:
        for ind in c.get("industries", []):
            industries[ind] = industries.get(ind, 0) + 1
    return [{"industry": k, "count": v} for k, v in sorted(industries.items(), key=lambda x: -x[1])]


@app.get("/api/companies/{slug}")
async def get_company(slug: str):
    companies = _data.get("companies", [])
    hiring = _data.get("hiring", {})

    for c in companies:
        if c.get("slug") == slug:
            return _format_company(c, hiring, detail=True)

    return {"error": "Company not found"}


@app.get("/api/jobs")
async def list_jobs(
    batch: Optional[str] = None,
    tier: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
):
    companies = _data.get("companies", [])
    hiring = _data.get("hiring", {})

    # Build job list from hiring companies
    jobs = []
    for c in companies:
        if c.get("slug") in hiring or c.get("isHiring"):
            jobs.append(
                {
                    "id": c.get("id", 0),
                    "company_name": c.get("name"),
                    "company_slug": c.get("slug"),
                    "batch": c.get("batch"),
                    "one_liner": c.get("one_liner"),
                    "logo_url": c.get("logo_url"),
                    "website": c.get("website"),
                    "yc_url": c.get("url"),
                    "is_hiring": True,
                }
            )

    if search:
        s = search.lower()
        jobs = [
            j for j in jobs
            if s in (j.get("company_name", "")).lower()
            or s in (j.get("one_liner", "")).lower()
        ]

    if batch:
        jobs = [j for j in jobs if j.get("batch") == batch]

    total = len(jobs)
    page = jobs[offset : offset + limit]

    return {"total": total, "limit": limit, "offset": offset, "jobs": page}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: int):
    companies = _data.get("companies", [])
    for c in companies:
        if c.get("id") == job_id:
            return _format_company(c, _data.get("hiring", {}))
    return {"error": "Job not found"}


@app.post("/api/search")
async def search(body: dict):
    query = body.get("query", "")
    limit = body.get("limit", 20)

    companies = _data.get("companies", [])
    hiring = _data.get("hiring", {})

    s = query.lower()
    results = [
        c
        for c in companies
        if s in (c.get("name", "")).lower()
        or s in (c.get("one_liner", "")).lower()
        or s in (c.get("long_description", "")).lower()
        or s in " ".join(c.get("industries", [])).lower()
    ]

    return {
        "query": query,
        "results": [_format_company(c, hiring) for c in results[:limit]],
        "count": len(results),
    }


def _format_company(c: dict, hiring: dict, detail: bool = False):
    is_hired = c.get("slug") in hiring or c.get("isHiring")
    fmt = {
        "id": c.get("id", 0),
        "slug": c.get("slug", ""),
        "name": c.get("name", ""),
        "one_liner": c.get("one_liner", ""),
        "batch": c.get("batch", ""),
        "status": c.get("status", ""),
        "industry": c.get("industries", [""])[0] if c.get("industries") else "",
        "industries": c.get("industries", []),
        "team_size": c.get("team_size", 0),
        "is_hiring": is_hired,
        "top_company": c.get("top_company", False),
        "website": c.get("website", ""),
        "logo_url": c.get("logo_url", ""),
        "yc_url": c.get("url", ""),
        "regions": c.get("regions", []),
        "tags": c.get("tags", []),
    }
    if detail:
        fmt["long_description"] = c.get("long_description", "")
        fmt["founders"] = c.get("founders", [])
        fmt["status"] = c.get("status", "")
    return fmt
