from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter(prefix="/attendance", tags=["Attendance"])

class AttendanceMark(BaseModel):
    course_id: str
    date: str # YYYY-MM-DD
    status: str # present, absent

class AttendanceUpdateInput(BaseModel):
    attended: int
    total: int

# Mock data
mock_attendance_list = []
mock_summary = {
    "overall_percentage": 0.0,
    "safe_zone": True,
    "classes_can_miss": 0,
    "courses": []
}

@router.get("")
@router.get("/")
async def list_attendance(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return mock_attendance_list

    try:
        courses_res = supabase.table("courses").select("id, name").eq("user_id", user_id).execute()
        if not courses_res.data:
            return []

        attendance_res = supabase.table("attendance").select("*").eq("user_id", user_id).execute()
        
        courses_map = {c["id"]: c["name"] for c in courses_res.data}
        stats = {cid: {"attended": 0, "total": 0} for cid in courses_map.keys()}

        for log in attendance_res.data:
            cid = log["course_id"]
            if cid in stats:
                stats[cid]["total"] += 1
                if log["status"] == "present":
                    stats[cid]["attended"] += 1

        return [
            {
                "id": cid,
                "course": name,
                "attended": stats[cid]["attended"],
                "total": stats[cid]["total"]
            }
            for cid, name in courses_map.items()
        ]
    except Exception:
        return mock_attendance_list

@router.put("/{id}")
async def update_attendance(id: str, data: AttendanceUpdateInput, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        for item in mock_attendance_list:
            if item["id"] == id:
                item["attended"] = data.attended
                item["total"] = data.total
        return {"status": "success"}

    try:
        # Delete existing logs for this course to write new ones
        supabase.table("attendance").delete().eq("user_id", user_id).eq("course_id", id).execute()
        
        payload = []
        import datetime
        today = datetime.date.today()
        for i in range(data.total):
            log_date = today - datetime.timedelta(days=i)
            status = "present" if i < data.attended else "absent"
            payload.append({
                "user_id": user_id,
                "course_id": id,
                "date": str(log_date),
                "status": status
            })
        
        if payload:
            supabase.table("attendance").insert(payload).execute()
        return {"status": "success"}
    except Exception:
        for item in mock_attendance_list:
            if item["id"] == id:
                item["attended"] = data.attended
                item["total"] = data.total
        return {"status": "success"}

@router.get("/summary")
async def get_attendance_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return mock_summary

    try:
        courses_res = supabase.table("courses").select("id, name").eq("user_id", user_id).execute()
        if not courses_res.data:
            return {"overall_percentage": 0, "safe_zone": True, "classes_can_miss": 0, "courses": []}

        attendance_res = supabase.table("attendance").select("*").eq("user_id", user_id).execute()
        
        courses_map = {c["id"]: c["name"] for c in courses_res.data}
        stats = {cid: {"attended": 0, "total": 0} for cid in courses_map.keys()}

        for log in attendance_res.data:
            cid = log["course_id"]
            if cid in stats:
                stats[cid]["total"] += 1
                if log["status"] == "present":
                    stats[cid]["attended"] += 1

        course_details = []
        overall_attended = 0
        overall_total = 0

        for cid, data in stats.items():
            name = courses_map[cid]
            attended = data["attended"]
            total = data["total"]
            pct = round((attended / total) * 100, 1) if total > 0 else 100.0
            
            overall_attended += attended
            overall_total += total
            
            course_details.append({
                "course_id": cid,
                "name": name,
                "attended": attended,
                "total": total,
                "percentage": pct
            })

        overall_pct = round((overall_attended / overall_total) * 100, 1) if overall_total > 0 else 100.0
        safe = overall_pct >= 75.0
        can_miss = 0
        if overall_total > 0:
            target = 0.75
            can_miss = int((overall_attended - target * overall_total) / target)
            if can_miss < 0:
                can_miss = 0

        return {
            "overall_percentage": overall_pct,
            "safe_zone": safe,
            "classes_can_miss": can_miss,
            "courses": course_details
        }
    except Exception as e:
        return {"error": str(e), "overall_percentage": 0, "courses": []}

@router.post("/mark")
async def mark_attendance(mark: AttendanceMark, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = {
        "user_id": user_id,
        "course_id": mark.course_id,
        "date": mark.date,
        "status": mark.status
    }

    if not supabase:
        for c in mock_summary["courses"]:
            if c["course_id"] == mark.course_id:
                c["total"] += 1
                if mark.status == "present":
                    c["attended"] += 1
                c["percentage"] = round((c["attended"] / c["total"]) * 100, 1)
        return {"status": "success"}

    try:
        response = supabase.table("attendance").upsert(payload, on_conflict="course_id,date").execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

