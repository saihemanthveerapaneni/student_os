# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

# Import routers
from app.routers import (
    users,
    courses,
    timetable,
    notes,
    assignments,
    attendance,
    gpa,
    ai_assistant,
    quizzes,
    search,
)

app = FastAPI(
    title="StudentOS API Backend",
    description="FastAPI service for StudentOS neubrutalist academic planner.",
    version="1.0.0",
)

# CORS configurations
origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(timetable.router)
app.include_router(notes.router)
app.include_router(assignments.router)
app.include_router(attendance.router)
app.include_router(gpa.router)
app.include_router(ai_assistant.router)
app.include_router(quizzes.router)
app.include_router(search.router)

@app.get("/") 
async def root(): 
         return {"message": "Welcome to the API!"}

@app.get("/health", tags=["System Health"])
async def health_check():
    return {
        "status": "healthy",
        "provider": settings.AI_PROVIDER,
        "supabase_initialized": settings.SUPABASE_URL != "https://mockproject.supabase.co"
    }

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)