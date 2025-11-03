from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import ScanTracker, WildThought
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class WildThoughtRequest(BaseModel):
    content: str

@router.post("/track")
async def track_scan(request: Request, db: Session = Depends(get_db)):
    """
    Track a QR code scan and return the current count.
    Returns the position of this scan (e.g., 127th student).
    """
    # Get IP address from request
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent", "")
    
    # Create scan record
    scan = ScanTracker(
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    
    # Get total count
    total_scans = db.query(ScanTracker).count()
    
    # Format ordinal number
    def get_ordinal(n):
        if 10 <= n % 100 <= 20:
            suffix = "th"
        else:
            suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
        return f"{n}{suffix}"
    
    return {
        "position": total_scans,
        "total": total_scans,
        "message": f"You're the {get_ordinal(total_scans)} student to scan!"
    }

@router.get("/count")
async def get_scan_count(db: Session = Depends(get_db)):
    """
    Get the total number of scans without tracking a new one.
    """
    total_scans = db.query(ScanTracker).count()
    return {
        "total": total_scans
    }

@router.post("/wild-thought")
async def submit_wild_thought(
    thought: WildThoughtRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Submit a wild/crazy thought anonymously (preview feature).
    These are stored separately from main posts.
    """
    if not thought.content or len(thought.content.strip()) == 0:
        return {"error": "Content cannot be empty"}
    
    if len(thought.content) > 5000:
        return {"error": "Content too long (max 5000 characters)"}
    
    ip_address = request.client.host if request.client else None
    
    wild_thought = WildThought(
        content=thought.content.strip(),
        ip_address=ip_address
    )
    db.add(wild_thought)
    db.commit()
    db.refresh(wild_thought)
    
    return {
        "success": True,
        "message": "Your wild thought has been dumped! 🎉",
        "id": wild_thought.id
    }

@router.get("/wild-thoughts/count")
async def get_wild_thoughts_count(db: Session = Depends(get_db)):
    """
    Get the total number of wild thoughts submitted.
    """
    count = db.query(WildThought).count()
    return {
        "total": count
    }

@router.get("/wild-thoughts")
async def get_wild_thoughts(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get paginated list of wild thoughts (newest first).
    Returns content and created_at only (anonymous - no IP).
    """
    offset = (page - 1) * limit
    
    # Get thoughts ordered by newest first
    thoughts = db.query(WildThought)\
        .order_by(WildThought.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    # Get total count
    total = db.query(WildThought).count()
    
    # Format response (only include content and created_at - keep anonymous)
    thoughts_data = [
        {
            "id": thought.id,
            "content": thought.content,
            "created_at": thought.created_at.isoformat() if thought.created_at else None
        }
        for thought in thoughts
    ]
    
    return {
        "thoughts": thoughts_data,
        "total": total,
        "page": page,
        "limit": limit,
        "has_more": offset + len(thoughts) < total
    }

