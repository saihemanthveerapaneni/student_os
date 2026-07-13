from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/users", tags=["Users"])

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    gender: Optional[str] = None
    theme: Optional[str] = None
    class_: Optional[str] = Field(None, alias="class")
    section: Optional[str] = None
    year: Optional[str] = None
    student_id: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None # YYYY-MM-DD
    bio: Optional[str] = None
    college_name: Optional[str] = None
    department: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[str] = None
    batch: Optional[str] = None
    advisor: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    certifications: Optional[List[str]] = None

    class Config:
        populate_by_name = True

class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    font_size: Optional[str] = None
    notifications: Optional[Dict[str, Any]] = None
    timetable_prefs: Optional[Dict[str, Any]] = None
    ai_prefs: Optional[Dict[str, Any]] = None
    calendar_prefs: Optional[Dict[str, Any]] = None
    privacy: Optional[Dict[str, Any]] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None

# Mock settings database
mock_settings = {
    "theme": "light",
    "accent_color": "yellow",
    "font_size": "medium",
    "notifications": {
        "assignments": True,
        "exams": True,
        "timetable": True,
        "attendance": True,
        "daily_study": False,
        "ai_assistant": True
    },
    "timetable_prefs": {
        "week_start": "Monday",
        "class_duration": 60,
        "break_duration": 10,
        "auto_highlight": True
    },
    "ai_prefs": {
        "model": "anthropic",
        "response_length": "medium",
        "study_mode": True,
        "ai_suggestions": True
    },
    "calendar_prefs": {
        "default_view": "Week",
        "week_starts_monday": True,
        "sync_google": False
    },
    "privacy": {
        "profile_visibility": "public",
        "hide_stats": False
    },
    "language": "en",
    "timezone": "UTC",
    "date_format": "DD/MM/YYYY",
    "time_format": "24h"
}

@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    email = current_user["email"]

    if not supabase:
        return {
            "id": user_id,
            "name": "",
            "email": email,
            "gender": "",
            "avatar_url": None,
            "theme": "light",
            "class": "",
            "section": "",
            "year": "",
            "student_id": "",
            "phone": "",
            "date_of_birth": None,
            "bio": "",
            "college_name": "",
            "department": "",
            "branch": "",
            "semester": "",
            "batch": "",
            "advisor": "",
            "linkedin_url": "",
            "github_url": "",
            "portfolio_url": "",
            "skills": [],
            "interests": [],
            "certifications": []
        }

    try:
        response = supabase.table("profiles").select("*").eq("id", user_id).execute()
        if response.data:
            return response.data[0]
        else:
            return {
                "id": user_id,
                "name": "",
                "email": email,
                "gender": "",
                "avatar_url": None,
                "theme": "light",
                "class": "",
                "section": "",
                "year": "",
                "student_id": "",
                "phone": "",
                "date_of_birth": None,
                "bio": "",
                "college_name": "",
                "department": "",
                "branch": "",
                "semester": "",
                "batch": "",
                "advisor": "",
                "linkedin_url": "",
                "github_url": "",
                "portfolio_url": "",
                "skills": [],
                "interests": [],
                "certifications": []
            }
    except Exception as e:
        return {"error": str(e), "id": user_id, "email": email}

@router.put("/me")
async def update_my_profile(profile_data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    update_dict = {}
    fields = [
        "name", "avatar_url", "theme", "section", "year", 
        "gender", "student_id", "phone", "date_of_birth", "bio", 
        "college_name", "department", "branch", "semester", 
        "batch", "advisor", "linkedin_url", "github_url", 
        "portfolio_url", "skills", "interests", "certifications"
    ]
    
    for f in fields:
        val = getattr(profile_data, f, None)
        if val is not None:
            if isinstance(val, str) and val.strip() == "":
                update_dict[f] = None
            else:
                update_dict[f] = val
            
    if profile_data.class_ is not None:
        update_dict["class"] = profile_data.class_

    if not supabase:
        return {"status": "success", "updated_data": update_dict}

    try:
        response = supabase.table("profiles").update(update_dict).eq("id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        return {"error": str(e)}

# --- user_settings routes ---
@router.get("/settings")
async def get_user_settings(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return mock_settings

    try:
        response = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
        if response.data:
            return response.data[0]
        else:
            # Create default settings record if none exists
            default_row = {"user_id": user_id, **mock_settings}
            res = supabase.table("user_settings").insert(default_row).execute()
            if res.data:
                return res.data[0]
            return default_row
    except Exception as e:
        return {"error": str(e), "settings": mock_settings}

@router.put("/settings")
async def update_user_settings(settings_data: UserSettingsUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    update_dict = {k: v for k, v in settings_data.dict().items() if v is not None}

    if not supabase:
        global mock_settings
        mock_settings.update(update_dict)
        return {"status": "success", "data": mock_settings}

    try:
        response = supabase.table("user_settings").update(update_dict).eq("user_id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
