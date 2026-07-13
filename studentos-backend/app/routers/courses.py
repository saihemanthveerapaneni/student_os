from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/courses", tags=["Courses"])

class CourseCreate(BaseModel):
    name: str
    instructor: Optional[str] = None
    accent_color: Optional[str] = "cornflower"

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    instructor: Optional[str] = None
    accent_color: Optional[str] = None

# Mock storage for development fallback
mock_courses = []

@router.get("/")
async def list_courses(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return mock_courses

    try:
        response = supabase.table("courses").select("*").eq("user_id", user_id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_course(course: CourseCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = {**course.dict(), "user_id": user_id}

    if not supabase:
        new_course = {"id": "mock-course-id", **course.dict()}
        mock_courses.append(new_course)
        return new_course

    try:
        response = supabase.table("courses").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_course(id: str, course: CourseUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    update_dict = {k: v for k, v in course.dict().items() if v is not None}

    if not supabase:
        for index, item in enumerate(mock_courses):
            if item["id"] == id:
                mock_courses[index] = {**item, **update_dict}
                return mock_courses[index]
        raise HTTPException(status_code=404, detail="Course not found")

    try:
        response = supabase.table("courses").update(update_dict).eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Course not found or unauthorized")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_course(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if not supabase:
        global mock_courses
        mock_courses = [c for c in mock_courses if c["id"] != id]
        return {"status": "success"}

    try:
        response = supabase.table("courses").delete().eq("id", id).eq("user_id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
