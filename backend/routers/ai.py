from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from backend.services.ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["AI"])
ai_service = AIService()

class Message(BaseModel):
    role: str = Field(..., description="Role of the message author (system, user, assistant)")
    content: str = Field(..., description="The content of the message")

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = Field("llama3.3", description="Groq model key (llama3.3, llama3.1, qwen, deepseek)")
    feature: Optional[str] = Field("study_chat", description="AI Feature context prompt key")
    temperature: Optional[float] = Field(0.7, description="Controls randomness")

@router.post("/chat")
def chat_ai(request: ChatRequest):
    """
    Post a list of messages and get a streaming AI response matching the requested feature and model.
    Returns a Server-Sent Events (SSE) stream.
    """
    # Convert Pydantic models to dicts
    message_dicts = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    
    if not message_dicts:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty")

    def event_stream_generator():
        try:
            for text_chunk in ai_service.generate_response_stream(
                messages=message_dicts,
                feature=request.feature,
                model_key=request.model,
                temperature=request.temperature
            ):
                # Clean or yield text chunks
                yield text_chunk
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    return StreamingResponse(event_stream_generator(), media_type="text/plain")
