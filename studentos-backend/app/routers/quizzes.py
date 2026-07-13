from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from pydantic import BaseModel

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])

class QuizAttemptInput(BaseModel):
    score: float
    total: float

@router.get("/{id}")
async def get_quiz(id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        # Return fallback mock quiz
        return {
            "id": id,
            "title": "Mitochondria & Energy Production",
            "questions": [
                {
                    "question": "What is the primary function of mitochondria in a cell?",
                    "options": ["Protein synthesis", "Energy production (ATP)", "Waste removal", "Cell division"],
                    "correct_index": 1
                }
            ]
        }

    try:
        response = supabase.table("quizzes").select("*").eq("id", id).eq("user_id", user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Quiz not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/attempt")
async def log_quiz_attempt(id: str, attempt: QuizAttemptInput, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    payload = {
        "user_id": user_id,
        "quiz_id": id,
        "score": attempt.score,
        "total": attempt.total
    }

    if not supabase:
        return {"status": "success", "data": payload}

    try:
        response = supabase.table("quiz_attempts").insert(payload).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
