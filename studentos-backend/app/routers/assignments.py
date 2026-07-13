from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/assignments", tags=["Assignments"])

class AssignmentCreate(BaseModel):
    course_id: Optional[str] = None
    title: str
    description: Optional[str] = ""
    due_date: Optional[str] = None # ISO format
    status: Optional[str] = "pending" # pending, in_progress, done

class AssignmentUpdate(BaseModel):
    course_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None

# Mock storage
mock_assignments = []

@router.get("/")
async def list_assignments(status: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        results = mock_assignments
        if status:
            results = [a for a in results if a["status"] == status]
        return results

    try:
        query = supabase.table("assignments").select("*, courses(name)").eq("user_id", user_id)
        if status:
            query = query.eq("status", status)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/preview")
async def preview_assignments(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return mock_assignments[:3]

    try:
        # Fetch pending/in_progress assignments first
        response = (
            supabase.table("assignments")
            .select("*, courses(name)")
            .eq("user_id", user_id)
            .neq("status", "done")
            .order("due_date", desc=False)
            .limit(3)
            .execute()
        )
        return response.data
    except Exception as e:
        return {"error": str(e)}

@router.get("/{id}")
async def get_assignment(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        for assignment in mock_assignments:
            if assignment["id"] == id:
                return assignment
        raise HTTPException(status_code=404, detail="Assignment not found")

    try:
        response = supabase.table("assignments").select("*").eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_assignment(assignment: AssignmentCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = {**assignment.dict(), "user_id": user_id}

    if not supabase:
        new_assignment = {"id": f"mock-assignment-{len(mock_assignments)+1}", **assignment.dict()}
        mock_assignments.append(new_assignment)
        return new_assignment

    try:
        response = supabase.table("assignments").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_assignment(id: str, assignment: AssignmentUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    update_dict = {k: v for k, v in assignment.dict().items() if v is not None}

    if not supabase:
        for idx, item in enumerate(mock_assignments):
            if item["id"] == id:
                mock_assignments[idx] = {**item, **update_dict}
                return mock_assignments[idx]
        raise HTTPException(status_code=404, detail="Assignment not found")

    try:
        response = supabase.table("assignments").update(update_dict).eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_assignment(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if not supabase:
        global mock_assignments
        mock_assignments = [a for a in mock_assignments if a["id"] != id]
        return {"status": "success"}

    try:
        response = supabase.table("assignments").delete().eq("id", id).eq("user_id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
