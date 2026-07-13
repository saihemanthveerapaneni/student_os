from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from app.services.gpa_service import calculate_sgpa, calculate_reverse_gpa
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/gpa", tags=["GPA"])

class GPASubjectInput(BaseModel):
    name: str
    credit_hours: float
    grade: Optional[str] = None
    semester: Optional[str] = "Semester 4"

class GPABulkInput(BaseModel):
    subjects: List[GPASubjectInput]

class GPAReverseRequest(BaseModel):
    target_gpa: float
    subjects: List[GPASubjectInput]

# Mock subjects
mock_gpa_subjects = []

@router.get("/current")
async def get_current_gpa(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        gpa = calculate_sgpa(mock_gpa_subjects)
        return {"sgpa": gpa, "cgpa": 8.4}

    try:
        response = supabase.table("gpa_subjects").select("*").eq("user_id", user_id).execute()
        if not response.data:
            return {"sgpa": 0.0, "cgpa": 8.4}
        
        sgpa = calculate_sgpa(response.data)
        return {"sgpa": sgpa, "cgpa": 8.4} # CGPA is aggregated/saved in profiles
    except Exception as e:
        return {"sgpa": 0.0, "cgpa": 8.4, "error": str(e)}

@router.get("/subjects")
async def list_gpa_subjects(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return mock_gpa_subjects

    try:
        response = supabase.table("gpa_subjects").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subjects")
async def upsert_gpa_subjects(bulk_input: GPABulkInput, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    if not supabase:
        global mock_gpa_subjects
        mock_gpa_subjects = []
        for idx, s in enumerate(bulk_input.subjects):
            mock_gpa_subjects.append({
                "id": str(idx + 1),
                "name": s.name,
                "credit_hours": s.credit_hours,
                "grade": s.grade,
                "semester": s.semester
            })
        return {"status": "success", "data": mock_gpa_subjects}

    try:
        # Delete existing entries for this user and insert new ones
        supabase.table("gpa_subjects").delete().eq("user_id", user_id).execute()
        
        payload = [{**s.dict(), "user_id": user_id} for s in bulk_input.subjects]
        if payload:
            response = supabase.table("gpa_subjects").insert(payload).execute()
            return {"status": "success", "data": response.data}
        return {"status": "success", "data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/calculate")
async def calculate_gpa_endpoint(bulk_input: GPABulkInput):
    subjects_list = [s.dict() for s in bulk_input.subjects]
    sgpa = calculate_sgpa(subjects_list)
    return {"sgpa": sgpa}

@router.post("/reverse")
async def reverse_gpa_endpoint(request: GPAReverseRequest):
    subjects_list = []
    for idx, s in enumerate(request.subjects):
        subjects_list.append({
            "id": str(idx + 1),
            "name": s.name,
            "credit_hours": s.credit_hours,
            "grade": s.grade
        })
    results = calculate_reverse_gpa(request.target_gpa, subjects_list)
    return results
