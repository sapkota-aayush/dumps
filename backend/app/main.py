from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import posts
from app.core.database import engine
from app.models.models import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dumps API",
    description="Backend API for Dumps.online - Anonymous social media platform",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Disable credentials for CORS
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])

# Add auth router for token generation
from app.api.routes import auth
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

@app.get("/")
async def root():
    return {"message": "Welcome to Dumps API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

