from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
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

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Development frontend
        "https://16.52.134.125",  # Production frontend (EC2 IP)
        "https://dumps.online",   # Future domain
        "https://www.dumps.online"  # Future domain with www
    ],
    allow_credentials=True,  # Enable credentials for production
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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

