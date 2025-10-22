from fastapi import APIRouter
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/generate-token")
async def generate_token():
    """Generate a new user token for anonymous posting"""
    token = str(uuid.uuid4())
    return JSONResponse({
        "token": token,
        "message": "Token generated successfully",
        "created_at": datetime.now().isoformat()
    })

