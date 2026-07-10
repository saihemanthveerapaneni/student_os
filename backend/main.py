import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import ai, analytics, files
from backend.config import settings

app = FastAPI(
    title="StudentOS Core API",
    description="FastAPI Backend for StudentOS - handling AI, Analytics calculations, and PDF File processing.",
    version="1.0.0"
)

# Configure CORS to allow Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(ai.router)
app.include_router(analytics.router)
app.include_router(files.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": "StudentOS Core API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
