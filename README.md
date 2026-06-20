# YC Job Dashboard

Job dashboard for Y Combinator companies with AI-powered search, tier scoring, and outreach tracking.

## Features

- **5,800+ YC companies** from the free yc-oss/api
- **Job listings** from public ATS APIs (Greenhouse, Lever, Ashby)
- **T1/T2/T3 tier scoring** based on reply probability signals
- **AI semantic search** (optional, via sentence-transformers)
- **Outreach tracker** with persistent notes per company/founder
- **Modern UI** with Next.js + Tailwind CSS

## Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Ingest Data

```bash
cd scripts
python ingest_all.py
```

This fetches:
- All YC companies from yc-oss/api (free, no auth)
- Job listings from public Greenhouse/Lever/Ashby endpoints (free)

### 3. Start Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/stats | Dashboard statistics |
| GET | /api/companies | List companies (filterable) |
| GET | /api/companies/{slug} | Company detail + founders + jobs |
| GET | /api/jobs | List jobs (filterable) |
| POST | /api/search | Text search |
| POST | /api/search/semantic | AI semantic search (requires embeddings) |
| GET | /api/outreach | List outreach notes |
| POST | /api/outreach | Create outreach note |
| PUT | /api/outreach/{id} | Update outreach note |
| DELETE | /api/outreach/{id} | Delete outreach note |

## Data Sources

| Source | Cost | Data |
|--------|------|------|
| yc-oss/api | Free | 5,800+ YC companies |
| Greenhouse API | Free | Job listings |
| Lever API | Free | Job listings |
| Ashby API | Free | Job listings |
| sentence-transformers | Free | Local embeddings |

## Optional: AI Search

To enable semantic search:

```bash
cd backend
pip install sentence-transformers
python -m services.embedding
```

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS
- **Backend**: FastAPI, SQLite
- **Data**: Free public APIs (no API keys required)
