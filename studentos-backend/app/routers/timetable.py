from fastapi import APIRouter, Depends, HTTPException, Query
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, time

router = APIRouter(prefix="/timetable", tags=["Timetable"])

class TimetableCreate(BaseModel):
    course_id: str
    day_of_week: str  # Monday, Tuesday, etc.
    start_time: str   # HH:MM
    end_time: str     # HH:MM
    room: Optional[str] = None

class TimetableUpdate(BaseModel):
    course_id: Optional[str] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None

# Mock storage for development fallback
mock_timetable = []

@router.get("/")
async def list_timetable(day: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        if day:
            return [t for t in mock_timetable if t["day_of_week"].lower() == day.lower()]
        return mock_timetable

    try:
        query = supabase.table("timetable").select("*, courses(name, accent_color)").eq("user_id", user_id)
        if day:
            query = query.eq("day_of_week", day)
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/next-class")
async def next_class(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return {
            "id": "t1",
            "course_name": "Advanced Physics",
            "start_time": "09:00",
            "end_time": "10:30",
            "room": "Room 302",
            "starts_in_minutes": 45
        }

    try:
        # Fetch current day of the week
        now = datetime.now()
        current_day = now.strftime("%A")
        
        # Get timetable events for today
        response = supabase.table("timetable").select("*, courses(name, accent_color)").eq("user_id", user_id).eq("day_of_week", current_day).execute()
        
        if not response.data:
            # Try getting any scheduled class
            fallback = supabase.table("timetable").select("*, courses(name, accent_color)").eq("user_id", user_id).limit(1).execute()
            if fallback.data:
                item = fallback.data[0]
                return {
                    "id": item["id"],
                    "course_name": item["courses"]["name"] if item.get("courses") else "Subject",
                    "start_time": item["start_time"],
                    "end_time": item["end_time"],
                    "room": item["room"],
                    "starts_in_minutes": None
                }
            return None

        # Find the next class starting after current time
        current_time_str = now.strftime("%H:%M:%S")
        upcoming = [x for x in response.data if x["start_time"] > current_time_str]
        upcoming.sort(key=lambda x: x["start_time"])

        if upcoming:
            next_event = upcoming[0]
            start_dt = datetime.strptime(f"{now.strftime('%Y-%m-%d')} {next_event['start_time']}", "%Y-%m-%d %H:%M:%S")
            diff = start_dt - now
            mins = int(diff.total_seconds() / 60)
            return {
                "id": next_event["id"],
                "course_name": next_event["courses"]["name"] if next_event.get("courses") else "Subject",
                "start_time": next_event["start_time"],
                "end_time": next_event["end_time"],
                "room": next_event["room"],
                "starts_in_minutes": mins
            }
        
        # If no more classes today, return the first class of the timetable generally
        first_event = response.data[0]
        return {
            "id": first_event["id"],
            "course_name": first_event["courses"]["name"] if first_event.get("courses") else "Subject",
            "start_time": first_event["start_time"],
            "end_time": first_event["end_time"],
            "room": first_event["room"],
            "starts_in_minutes": None
        }
    except Exception as e:
        # Graceful fallback on error
        return {
            "error": str(e),
            "course_name": "None scheduled",
            "starts_in_minutes": None
        }

@router.post("/")
async def create_timetable_entry(entry: TimetableCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = {**entry.dict(), "user_id": user_id}

    if not supabase:
        new_entry = {"id": "mock-t-id", **entry.dict()}
        mock_timetable.append(new_entry)
        return new_entry

    try:
        response = supabase.table("timetable").insert(payload).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_timetable_entry(id: str, entry: TimetableUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    update_dict = {k: v for k, v in entry.dict().items() if v is not None}

    if not supabase:
        for idx, item in enumerate(mock_timetable):
            if item["id"] == id:
                mock_timetable[idx] = {**item, **update_dict}
                return mock_timetable[idx]
        raise HTTPException(status_code=404, detail="Entry not found")

    try:
        response = supabase.table("timetable").update(update_dict).eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Entry not found or unauthorized")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_timetable_entry(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if not supabase:
        global mock_timetable
        mock_timetable = [x for x in mock_timetable if x["id"] != id]
        return {"status": "success"}

    try:
        response = supabase.table("timetable").delete().eq("id", id).eq("user_id", user_id).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
