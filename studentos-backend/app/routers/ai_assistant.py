from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.supabase_client import supabase
from app.services.ai_service import ai_service
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

class ChatMessageInput(BaseModel):
    message: str
    session_id: Optional[str] = None

class QuizInput(BaseModel):
    notes_text: str
    source_note_id: Optional[str] = None

class SummaryInput(BaseModel):
    notes_text: str
    note_id: Optional[str] = None

@router.post("/chat")
async def chat_with_bot(chat_input: ChatMessageInput, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    sess_id = chat_input.session_id or str(uuid.uuid4())

    history = []
    if supabase:
        try:
            # Get last 10 messages for context
            response = (
                supabase.table("ai_chats")
                .select("role, message")
                .eq("user_id", user_id)
                .eq("session_id", sess_id)
                .order("created_at", desc=False)
                .limit(10)
                .execute()
            )
            history = response.data or []
        except Exception:
            pass

    # Call AI service
    bot_reply = await ai_service.get_chat_response(chat_input.message, history)

    if supabase:
        try:
            # Save user message
            supabase.table("ai_chats").insert({
                "user_id": user_id,
                "session_id": sess_id,
                "role": "user",
                "message": chat_input.message
            }).execute()

            # Save assistant reply
            supabase.table("ai_chats").insert({
                "user_id": user_id,
                "session_id": sess_id,
                "role": "assistant",
                "message": bot_reply
            }).execute()
        except Exception:
            pass

    return {
        "session_id": sess_id,
        "reply": bot_reply
    }

@router.get("/chats/latest")
async def get_latest_chat(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        return []

    try:
        response = (
            supabase.table("ai_chats")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        # Reverse to get chronological order
        return response.data[::-1]
    except Exception as e:
        return {"error": str(e)}

@router.delete("/chats")
async def clear_chat_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        supabase.table("ai_chats").delete().eq("user_id", user_id).execute()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz")
async def generate_quiz_endpoint(quiz_input: QuizInput, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    questions = await ai_service.generate_quiz(quiz_input.notes_text)

    quiz_record = {
        "user_id": user_id,
        "source_note_id": quiz_input.source_note_id,
        "title": "AI Generated Study Quiz",
        "questions": questions
    }

    if supabase:
        try:
            res = supabase.table("quizzes").insert(quiz_record).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    # Return with a mock ID if db fails or not configured
    return {"id": str(uuid.uuid4()), **quiz_record}

@router.post("/summarize")
async def generate_summary_endpoint(summary_input: SummaryInput, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    summary_bullets = await ai_service.generate_summary(summary_input.notes_text)
    summary_text = "\n".join([f"- {b}" for b in summary_bullets])

    summary_record = {
        "user_id": user_id,
        "note_id": summary_input.note_id,
        "original_text": summary_input.notes_text,
        "summary_text": summary_text
    }

    if supabase:
        try:
            res = supabase.table("note_summaries").insert(summary_record).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass

    return {"id": str(uuid.uuid4()), **summary_record, "bullets": summary_bullets}
