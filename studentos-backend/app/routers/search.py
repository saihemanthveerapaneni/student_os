from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user
from app.supabase_client import supabase
from typing import List, Dict, Any

router = APIRouter(prefix="/search", tags=["Global Search"])

@router.get("")
async def global_search(q: str = Query(..., min_length=1), current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    if not supabase:
        # Mock results fallback
        from app.routers.notes import mock_notes
        from app.routers.assignments import mock_assignments
        
        matched_notes = [
            n for n in mock_notes 
            if q.lower() in n["title"].lower() or q.lower() in n["content"].lower()
        ]
        matched_assignments = [
            a for a in mock_assignments 
            if q.lower() in a["title"].lower() or q.lower() in a["description"].lower()
        ]
        return {
            "notes": matched_notes,
            "assignments": matched_assignments
        }

    try:
        # Search Notes (title/content keyword match)
        notes_res = (
            supabase.table("notes")
            .select("*, courses(name)")
            .eq("user_id", user_id)
            .or_(f"title.ilike.%{q}%,content.ilike.%{q}%")
            .execute()
        )

        # Search Assignments (title/description keyword match)
        assignments_res = (
            supabase.table("assignments")
            .select("*, courses(name)")
            .eq("user_id", user_id)
            .or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
            .execute()
        )

        return {
            "notes": notes_res.data or [],
            "assignments": assignments_res.data or []
        }
    except Exception as e:
        return {
            "notes": [],
            "assignments": [],
            "error": str(e)
        }
    
