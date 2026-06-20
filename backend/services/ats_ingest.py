import httpx
import asyncio
import json
import re
from datetime import datetime
from database import get_db, init_db

# Known YC company ATS board tokens (Greenhouse/Lever)
# Add more as discovered
KNOWN_BOARDS = {
    "greenhouse": [
        "stripe", "airbnb", "figma", "notion", "ramp",
        "brex", "plaid", "coinbase", "doordash", "instacart",
        "gitlab", "docker", "supabase", "vercel", "netlify",
        "posthog", "mixpanel", "amplitude", "segment", "twilio",
        "cursor", "replit", "anthropic", "openai", "scale-ai",
        "databricks", "dbt-labs", "hashicorp", "snyk", "checkr",
        "flexport", "flex", "rippling", "deel", "ramp",
        "frontend-master", "postman", "exponent", "bytebase",
    ],
    "lever": [
        "figma", "spotify", "netflix", "airbnb", "dropbox",
        "slack", "square", "asana", "lattice", "lever",
        "nuro", "kite", "common-room", "calm", "gusto",
    ],
    "ashby": [
        "ashby", "linear", "retool", "temporal", "railway",
        "render", "neon", "turso", "planetscale", "supabase",
    ],
}


def parse_salary(text: str):
    """Extract salary range from job description."""
    if not text:
        return None, None

    patterns = [
        r"\$(\d{2,3})[kK]\s*[-–to]+\s*\$(\d{2,3})[kK]",
        r"\$(\d{2,3},?\d{3})\s*[-–to]+\s*\$(\d{2,3},?\d{3})",
        r"salary[:\s]+\$(\d{2,3})[kK]\s*[-–to]+\s*\$(\d{2,3})[kK]",
        r"compensation[:\s]+\$(\d{2,3})[kK]\s*[-–to]+\s*\$(\d{2,3})[kK]",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            low = match.group(1).replace(",", "")
            high = match.group(2).replace(",", "")
            low_num = int(low) * 1000 if len(low) <= 3 else int(low)
            high_num = int(high) * 1000 if len(high) <= 3 else int(high)
            return low_num, high_num

    return None, None


def is_remote(text: str, location: str = ""):
    """Determine if a job is remote."""
    combined = f"{text or ''} {location or ''}".lower()
    remote_keywords = ["remote", "work from home", "wfh", "anywhere", "distributed"]
    return any(kw in combined for kw in remote_keywords)


def compute_tier(job: dict) -> str:
    """Compute tier based on reply probability signals."""
    score = 0

    posted = job.get("posted_at")
    if posted:
        try:
            if isinstance(posted, str):
                posted_date = datetime.fromisoformat(posted.replace("Z", "+00:00"))
            else:
                posted_date = posted
            days_old = (datetime.now().astimezone() - posted_date).days
            if days_old < 7:
                score += 3
            elif days_old < 30:
                score += 2
            elif days_old < 90:
                score += 1
        except Exception:
            pass

    desc = (job.get("description") or "").lower()
    if "urgent" in desc or "asap" in desc or "immediately" in desc:
        score += 2
    if "series a" in desc or "series b" in desc or "funded" in desc:
        score += 1
    if job.get("salary_min") or job.get("salary_max"):
        score += 1

    if score >= 4:
        return "T1"
    elif score >= 2:
        return "T2"
    return "T3"


async def fetch_greenhouse_jobs(board_token: str, client: httpx.AsyncClient):
    """Fetch jobs from a Greenhouse board."""
    try:
        resp = await client.get(
            f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs",
            timeout=10.0,
        )
        if resp.status_code != 200:
            return []

        data = resp.json()
        jobs = []
        for j in data.get("jobs", []):
            location = j.get("location", {}).get("name", "")
            full_text = j.get("content", "") or ""

            salary_min, salary_max = parse_salary(full_text)

            jobs.append(
                {
                    "external_id": f"gh_{board_token}_{j['id']}",
                    "title": j.get("title", ""),
                    "description": full_text[:5000] if full_text else "",
                    "location": location,
                    "remote": is_remote(full_text, location),
                    "salary_min": salary_min,
                    "salary_max": salary_max,
                    "department": (
                        j.get("departments", [{}])[0].get("name")
                        if j.get("departments")
                        else None
                    ),
                    "source": "greenhouse",
                    "source_url": j.get("absolute_url", ""),
                    "posted_at": j.get("updated_at"),
                }
            )
        return jobs
    except Exception as e:
        print(f"  Error fetching Greenhouse {board_token}: {e}")
        return []


async def fetch_lever_jobs(site: str, client: httpx.AsyncClient):
    """Fetch jobs from a Lever posting."""
    try:
        resp = await client.get(
            f"https://api.lever.co/v0/postings/{site}",
            params={"mode": "json"},
            timeout=10.0,
        )
        if resp.status_code != 200:
            return []

        data = resp.json()
        jobs = []
        for j in data:
            categories = j.get("categories", {})
            location = categories.get("location", "")

            salary_min = None
            salary_max = None
            salary_raw = j.get("salaryRange") or j.get("compensation", "")
            if salary_raw and isinstance(salary_raw, dict):
                salary_min = salary_raw.get("min")
                salary_max = salary_raw.get("max")
            elif salary_raw and isinstance(salary_raw, str):
                salary_min, salary_max = parse_salary(salary_raw)

            posted = j.get("createdAt")
            if posted:
                posted = datetime.fromtimestamp(posted / 1000).isoformat()

            jobs.append(
                {
                    "external_id": f"lever_{site}_{j.get('id', '')}",
                    "title": j.get("text", ""),
                    "description": (j.get("descriptionPlain", "") or j.get("description", ""))[:5000],
                    "location": location,
                    "remote": is_remote(j.get("descriptionPlain", ""), location),
                    "salary_min": salary_min,
                    "salary_max": salary_max,
                    "department": categories.get("department"),
                    "employment_type": categories.get("commitment"),
                    "source": "lever",
                    "source_url": j.get("hostedUrl", ""),
                    "posted_at": posted,
                }
            )
        return jobs
    except Exception as e:
        print(f"  Error fetching Lever {site}: {e}")
        return []


async def fetch_ashby_jobs(board_name: str, client: httpx.AsyncClient):
    """Fetch jobs from an Ashby board."""
    try:
        resp = await client.get(
            f"https://api.ashbyhq.com/posting-api/job-board/{board_name}",
            params={"includeCompensation": "true"},
            timeout=10.0,
        )
        if resp.status_code != 200:
            return []

        data = resp.json()
        jobs = []
        for j in data.get("jobPostings", []):
            location = j.get("locationName", "")
            salary_min = None
            salary_max = None

            compensation = j.get("compensation", {})
            if compensation:
                salary_min = compensation.get("minValue")
                salary_max = compensation.get("maxValue")

            jobs.append(
                {
                    "external_id": f"ashby_{board_name}_{j.get('id', '')}",
                    "title": j.get("title", ""),
                    "description": (j.get("description", "") or "")[:5000],
                    "location": location,
                    "remote": is_remote(j.get("description", ""), location),
                    "salary_min": salary_min,
                    "salary_max": salary_max,
                    "department": j.get("departmentName"),
                    "employment_type": j.get("employmentType"),
                    "source": "ashby",
                    "source_url": f"https://jobs.ashbyhq.com/{board_name}/{j.get('id', '')}",
                    "posted_at": j.get("createdAt"),
                }
            )
        return jobs
    except Exception as e:
        print(f"  Error fetching Ashby {board_name}: {e}")
        return []


async def ingest_jobs():
    """Ingest jobs from all ATS sources."""
    await init_db()
    db = await get_db()

    total_inserted = 0
    total_skipped = 0

    try:
        async with httpx.AsyncClient() as client:
            # Greenhouse
            print(f"\nFetching Greenhouse jobs from {len(KNOWN_BOARDS['greenhouse'])} boards...")
            for board in KNOWN_BOARDS["greenhouse"]:
                jobs = await fetch_greenhouse_jobs(board, client)
                for job in jobs:
                    cursor = await db.execute(
                        "SELECT id FROM companies WHERE slug = ? OR name LIKE ?",
                        (board, f"%{board}%"),
                    )
                    company = await cursor.fetchone()
                    company_id = company[0] if company else None

                    job["tier"] = compute_tier(job)

                    cursor = await db.execute(
                        "SELECT id FROM jobs WHERE external_id = ?", (job["external_id"],)
                    )
                    if await cursor.fetchone():
                        total_skipped += 1
                        continue

                    await db.execute(
                        """INSERT INTO jobs
                            (company_id, external_id, title, description, location,
                             remote, salary_min, salary_max, department, employment_type,
                             source, source_url, tier, posted_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (
                            company_id,
                            job["external_id"],
                            job["title"],
                            job["description"],
                            job["location"],
                            job["remote"],
                            job["salary_min"],
                            job["salary_max"],
                            job.get("department"),
                            job.get("employment_type"),
                            job["source"],
                            job["source_url"],
                            job["tier"],
                            job["posted_at"],
                        ),
                    )
                    total_inserted += 1
                print(f"  {board}: {len(jobs)} jobs fetched")

            # Lever
            print(f"\nFetching Lever jobs from {len(KNOWN_BOARDS['lever'])} sites...")
            for site in KNOWN_BOARDS["lever"]:
                jobs = await fetch_lever_jobs(site, client)
                for job in jobs:
                    cursor = await db.execute(
                        "SELECT id FROM companies WHERE slug = ? OR name LIKE ?",
                        (site, f"%{site}%"),
                    )
                    company = await cursor.fetchone()
                    company_id = company[0] if company else None

                    job["tier"] = compute_tier(job)

                    cursor = await db.execute(
                        "SELECT id FROM jobs WHERE external_id = ?", (job["external_id"],)
                    )
                    if await cursor.fetchone():
                        total_skipped += 1
                        continue

                    await db.execute(
                        """INSERT INTO jobs
                            (company_id, external_id, title, description, location,
                             remote, salary_min, salary_max, department, employment_type,
                             source, source_url, tier, posted_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (
                            company_id,
                            job["external_id"],
                            job["title"],
                            job["description"],
                            job["location"],
                            job["remote"],
                            job["salary_min"],
                            job["salary_max"],
                            job.get("department"),
                            job.get("employment_type"),
                            job["source"],
                            job["source_url"],
                            job["tier"],
                            job["posted_at"],
                        ),
                    )
                    total_inserted += 1
                print(f"  {site}: {len(jobs)} jobs fetched")

            # Ashby
            print(f"\nFetching Ashby jobs from {len(KNOWN_BOARDS['ashby'])} boards...")
            for board in KNOWN_BOARDS["ashby"]:
                jobs = await fetch_ashby_jobs(board, client)
                for job in jobs:
                    cursor = await db.execute(
                        "SELECT id FROM companies WHERE slug = ? OR name LIKE ?",
                        (board, f"%{board}%"),
                    )
                    company = await cursor.fetchone()
                    company_id = company[0] if company else None

                    job["tier"] = compute_tier(job)

                    cursor = await db.execute(
                        "SELECT id FROM jobs WHERE external_id = ?", (job["external_id"],)
                    )
                    if await cursor.fetchone():
                        total_skipped += 1
                        continue

                    await db.execute(
                        """INSERT INTO jobs
                            (company_id, external_id, title, description, location,
                             remote, salary_min, salary_max, department, employment_type,
                             source, source_url, tier, posted_at)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                        (
                            company_id,
                            job["external_id"],
                            job["title"],
                            job["description"],
                            job["location"],
                            job["remote"],
                            job["salary_min"],
                            job["salary_max"],
                            job.get("department"),
                            job.get("employment_type"),
                            job["source"],
                            job["source_url"],
                            job["tier"],
                            job["posted_at"],
                        ),
                    )
                    total_inserted += 1
                print(f"  {board}: {len(jobs)} jobs fetched")

        await db.commit()
        print(f"\nDone: {total_inserted} jobs inserted, {total_skipped} skipped (duplicates)")
        return {"inserted": total_inserted, "skipped": total_skipped}
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(ingest_jobs())
