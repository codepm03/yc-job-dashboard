from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import get_db
from datetime import datetime

router = APIRouter()


class OutreachCreate(BaseModel):
    founder_id: Optional[int] = None
    company_id: Optional[int] = None
    note: str
    status: str = "not_sent"


class OutreachUpdate(BaseModel):
    note: Optional[str] = None
    status: Optional[str] = None


@router.get("")
async def list_outreach(
    company_id: Optional[int] = None,
    founder_id: Optional[int] = None,
    status: Optional[str] = None,
):
    db = await get_db()
    try:
        query = """
            SELECT o.*, c.name as company_name, f.full_name as founder_name
            FROM outreach_notes o
            LEFT JOIN companies c ON o.company_id = c.id
            LEFT JOIN founders f ON o.founder_id = f.id
            WHERE 1=1
        """
        params = []

        if company_id:
            query += " AND o.company_id = ?"
            params.append(company_id)
        if founder_id:
            query += " AND o.founder_id = ?"
            params.append(founder_id)
        if status:
            query += " AND o.status = ?"
            params.append(status)

        query += " ORDER BY o.updated_at DESC"

        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return {"notes": [dict(row) for row in rows]}
    finally:
        await db.close()


@router.post("")
async def create_outreach(req: OutreachCreate):
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO outreach_notes (founder_id, company_id, note, status)
               VALUES (?, ?, ?, ?)""",
            (req.founder_id, req.company_id, req.note, req.status),
        )
        await db.commit()
        note_id = cursor.lastrowid

        cursor = await db.execute("SELECT * FROM outreach_notes WHERE id = ?", (note_id,))
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()


@router.put("/{note_id}")
async def update_outreach(note_id: int, req: OutreachUpdate):
    db = await get_db()
    try:
        updates = []
        params = []

        if req.note is not None:
            updates.append("note = ?")
            params.append(req.note)
        if req.status is not None:
            updates.append("status = ?")
            params.append(req.status)
            if req.status == "sent":
                updates.append("sent_at = ?")
                params.append(datetime.now().isoformat())

        if not updates:
            return {"error": "No fields to update"}

        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(note_id)

        await db.execute(
            f"UPDATE outreach_notes SET {', '.join(updates)} WHERE id = ?", params
        )
        await db.commit()

        cursor = await db.execute("SELECT * FROM outreach_notes WHERE id = ?", (note_id,))
        row = await cursor.fetchone()
        return dict(row)
    finally:
        await db.close()


@router.delete("/{note_id}")
async def delete_outreach(note_id: int):
    db = await get_db()
    try:
        await db.execute("DELETE FROM outreach_notes WHERE id = ?", (note_id,))
        await db.commit()
        return {"deleted": True}
    finally:
        await db.close()
