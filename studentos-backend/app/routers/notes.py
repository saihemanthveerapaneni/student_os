from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/notes", tags=["Notes"])

class NoteCreate(BaseModel):
    course_id: Optional[str] = None
    title: str
    content: Optional[str] = ""
    tags: Optional[List[str]] = []
    accent_color: Optional[str] = "cream"

class NoteUpdate(BaseModel):
    course_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    accent_color: Optional[str] = None

# Mock notes storage
mock_notes = []

@router.get("/")
async def list_notes(
    search: Optional[str] = None,
    course_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    if not supabase:
        results = mock_notes
        if course_id:
            results = [n for n in results if n["course_id"] == course_id]
        if search:
            results = [n for n in results if search.lower() in n["title"].lower() or search.lower() in n["content"].lower()]
        return results

    try:
        query = supabase.table("notes").select("*, courses(name)").eq("user_id", user_id)
        if course_id:
            query = query.eq("course_id", course_id)
        if search:
            query = query.ilike("title", f"%{search}%") # simple filter on title
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/count")
async def get_notes_count(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return {"count": len(mock_notes)}

    try:
        response = supabase.table("notes").select("id", count="exact").eq("user_id", user_id).execute()
        return {"count": response.count if response.count is not None else len(response.data)}
    except Exception as e:
        return {"count": 0, "error": str(e)}

@router.get("/{id}")
async def get_note(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        for note in mock_notes:
            if note["id"] == id:
                return note
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        response = supabase.table("notes").select("*").eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Note not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_note(note: NoteCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = {**note.dict(), "user_id": user_id}

    if not supabase:
        new_note = {"id": f"mock-note-{len(mock_notes)+1}", **note.dict()}
        mock_notes.append(new_note)
        return new_note

    try:
        response = supabase.table("notes").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_note(id: str, note: NoteUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    update_dict = {k: v for k, v in note.dict().items() if v is not None}

    if not supabase:
        for idx, item in enumerate(mock_notes):
            if item["id"] == id:
                mock_notes[idx] = {**item, **update_dict}
                return mock_timetable[idx]
        raise HTTPException(status_code=404, detail="Note not found")

    try:
        response = supabase.table("notes").update(update_dict).eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Note not found or unauthorized")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_note(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if not supabase:
        global mock_notes
        mock_notes = [n for n in mock_notes if n["id"] != id]
        return {"status": "success"}

    try:
        response = supabase.table("notes").delete().eq("id", id).eq("user_id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
