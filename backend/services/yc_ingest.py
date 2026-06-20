import httpx
import asyncio
import json
from database import get_db, init_db

YC_API_BASE = "https://yc-oss.github.io/api"


async def fetch_yc_companies():
    """Fetch all YC companies from the free yc-oss API."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("Fetching YC companies from yc-oss/api...")
        resp = await client.get(f"{YC_API_BASE}/companies/all.json")
        resp.raise_for_status()
        companies = resp.json()
        print(f"Fetched {len(companies)} companies")
        return companies


def parse_company(c: dict) -> dict:
    """Parse a YC company record into our schema."""
    industries = c.get("industries", [])
    industry = industries[0] if industries else None

    return {
        "slug": c.get("slug", c.get("name", "").lower().replace(" ", "-")),
        "name": c.get("name", ""),
        "description": c.get("one_liner", ""),
        "long_description": c.get("long_description", ""),
        "url": c.get("url", ""),
        "batch": c.get("batch", ""),
        "status": c.get("status", ""),
        "industry": industry,
        "team_size": c.get("team_size", 0),
        "website": c.get("website", ""),
        "logo_url": c.get("logo_url", ""),
        "top_company": c.get("top_company", False),
        "is_hiring": c.get("isHiring", False),
        "regions": json.dumps(c.get("regions", [])),
        "tags": json.dumps(c.get("tags", [])),
        "one_liner": c.get("one_liner", ""),
        "yc_url": c.get("url", ""),
    }


async def ingest_yc_companies():
    """Ingest YC companies into SQLite."""
    await init_db()
    companies = await fetch_yc_companies()
    db = await get_db()

    inserted = 0
    updated = 0

    try:
        for c in companies:
            parsed = parse_company(c)

            cursor = await db.execute(
                "SELECT id FROM companies WHERE slug = ?", (parsed["slug"],)
            )
            existing = await cursor.fetchone()

            if existing:
                await db.execute(
                    """UPDATE companies SET
                        name=?, description=?, long_description=?, url=?,
                        batch=?, status=?, industry=?, team_size=?,
                        website=?, logo_url=?, top_company=?, is_hiring=?,
                        regions=?, tags=?, one_liner=?, yc_url=?,
                        updated_at=CURRENT_TIMESTAMP
                    WHERE slug=?""",
                    (
                        parsed["name"],
                        parsed["description"],
                        parsed["long_description"],
                        parsed["url"],
                        parsed["batch"],
                        parsed["status"],
                        parsed["industry"],
                        parsed["team_size"],
                        parsed["website"],
                        parsed["logo_url"],
                        parsed["top_company"],
                        parsed["is_hiring"],
                        parsed["regions"],
                        parsed["tags"],
                        parsed["one_liner"],
                        parsed["yc_url"],
                        parsed["slug"],
                    ),
                )
                updated += 1
            else:
                await db.execute(
                    """INSERT INTO companies
                        (slug, name, description, long_description, url, batch,
                         status, industry, team_size, website, logo_url,
                         top_company, is_hiring, regions, tags, one_liner, yc_url)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (
                        parsed["slug"],
                        parsed["name"],
                        parsed["description"],
                        parsed["long_description"],
                        parsed["url"],
                        parsed["batch"],
                        parsed["status"],
                        parsed["industry"],
                        parsed["team_size"],
                        parsed["website"],
                        parsed["logo_url"],
                        parsed["top_company"],
                        parsed["is_hiring"],
                        parsed["regions"],
                        parsed["tags"],
                        parsed["one_liner"],
                        parsed["yc_url"],
                    ),
                )
                inserted += 1

        await db.commit()
        print(f"Done: {inserted} inserted, {updated} updated")
        return {"inserted": inserted, "updated": updated}
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(ingest_yc_companies())
