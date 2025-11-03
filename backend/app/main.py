from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.api.routes import posts
from app.core.database import engine
from app.models.models import Base
import os

# Create database tables
Base.metadata.create_all(bind=engine)

# Import and run the indexes script
try:
    from add_indexes import add_indexes
    add_indexes()
except Exception as e:
    print(f"Warning: Could not add indexes: {e}")

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
# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dumps.online",       # Production domain
        "http://16.52.134.125:8080",  # Frontend on port 8080
        "http://localhost:8080",      # Local frontend
        "http://localhost:8081",      # Alternative frontend port
        "http://localhost:8082",      # Alternative frontend port
        "http://172.31.39.166:8080",  # Internal network
        "http://localhost:5173",      # Vite default port
        "http://localhost:3000"       # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])

# Add auth router for token generation
from app.api.routes import auth
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

# Add scans router for QR code tracking
from app.api.routes import scans
app.include_router(scans.router, prefix="/api/scans", tags=["scans"])

# Serve uploaded images
uploads_path = os.path.join(os.path.dirname(__file__), "..", "uploads")
if os.path.exists(uploads_path):
    app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

@app.get("/")
async def root():
    return {"message": "Welcome to Dumps API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Handle OPTIONS requests for CORS
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return {"message": "OK"}

