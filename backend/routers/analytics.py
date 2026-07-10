from fastapi import APIRouter, HTTPException, Query
from supabase import create_client, Client
from backend.config import settings
from typing import Dict, Any, List
import uuid

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def get_supabase_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase environment variables not configured.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

@router.get("/summary")
def get_student_summary(user_id: str = Query(..., description="The user UUID to calculate analytics for")):
    """
    Computes attendance percentages, identifies low-attendance alerts, 
    and generates learning recommendations based on course statuses.
    """
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user_id UUID format")

    supabase = get_supabase_client()

    # 1. Fetch Courses
    courses_res = supabase.table("courses").select("id, code, name, color").eq("user_id", user_id).execute()
    courses = courses_res.data or []
    
    if not courses:
        return {
            "overall_percentage": 0.0,
            "subject_stats": [],
            "alerts": [],
            "recommendations": ["Create some courses to see academic recommendations!"]
        }

    course_map = {c["id"]: c for c in courses}

    # 2. Fetch Attendance
    attendance_res = supabase.table("attendance").select("course_id, status").eq("user_id", user_id).execute()
    attendance_records = attendance_res.data or []

    # Calculate statistics per course
    stats = {}
    for c in courses:
        stats[c["id"]] = {"present": 0, "total": 0}

    for record in attendance_records:
        cid = record["course_id"]
        if cid in stats:
            stats[cid]["total"] += 1
            if record["status"] == "present":
                stats[cid]["present"] += 1

    subject_stats = []
    low_attendance_alerts = []
    total_classes = 0
    total_present = 0

    for cid, counts in stats.items():
        course = course_map[cid]
        total = counts["total"]
        present = counts["present"]
        
        percentage = round((present / total) * 100, 1) if total > 0 else 100.0
        
        total_classes += total
        total_present += present

        stat_item = {
            "course_id": cid,
            "course_code": course["code"],
            "course_name": course["name"],
            "color": course["color"],
            "present": present,
            "total_classes": total,
            "percentage": percentage
        }
        subject_stats.append(stat_item)

        # Flag low attendance if below 75%
        if percentage < 75.0 and total > 0:
            low_attendance_alerts.append({
                "course_code": course["code"],
                "course_name": course["name"],
                "percentage": percentage,
                "msg": f"Attendance in {course['code']} is below 75% minimum threshold."
            })

    overall_percentage = round((total_present / total_classes) * 100, 1) if total_classes > 0 else 100.0

    # 3. Fetch Pending Assignments to generate recommendations
    assignments_res = supabase.table("assignments").select("title, due_date, priority").eq("user_id", user_id).eq("status", "pending").execute()
    pending_assignments = assignments_res.data or []

    # 4. Generate recommendations
    recommendations = []
    
    # Check for urgent assignments
    high_priority = [a for a in pending_assignments if a["priority"] == "high"]
    if high_priority:
        recommendations.append(f"Complete urgent project: '{high_priority[0]['title']}' immediately.")

    # Check for attendance alert actions
    for alert in low_attendance_alerts:
        recommendations.append(f"Attend next session of {alert['course_code']} or contact professor to recover attendance.")

    # General recommendations
    if overall_percentage < 80.0:
        recommendations.append("Overall attendance is low. Schedule a study plan to catch up on missed lecture notes.")
    
    if len(pending_assignments) > 5:
        recommendations.append(f"You have {len(pending_assignments)} pending tasks. Try using the AI Planner to organize your week.")

    if not recommendations:
        recommendations.append("You are in great academic shape! Keep up the good work.")

    return {
        "overall_percentage": overall_percentage,
        "total_present": total_present,
        "total_classes": total_classes,
        "subject_stats": subject_stats,
        "alerts": low_attendance_alerts,
        "recommendations": recommendations[:4] # limit to 4 items
    }
