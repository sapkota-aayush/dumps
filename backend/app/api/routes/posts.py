from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db
from app.models.models import Post
from app.schemas.schemas import PostCreate, PostUpdate, PostResponse, PostListResponse
from typing import List, Optional
import uuid
from datetime import datetime

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# Create a new post
@router.post("/create", response_model=PostResponse)
@limiter.limit("20/hour")
async def create_post(request: Request, post: PostCreate, db: Session = Depends(get_db)):
    db_post = Post(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

# Get all posts (global feed)
@router.get("/posts", response_model=PostListResponse)
@limiter.limit("200/hour")
async def get_posts(
    request: Request,
    hashtag: Optional[str] = Query(None, description="Filter by hashtag"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Posts per page"),
    db: Session = Depends(get_db)
):
    query = db.query(Post)
    
    if hashtag:
        query = query.filter(Post.hashtag == hashtag)
    
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return PostListResponse(
        posts=posts,
        total=total,
        page=page,
        limit=limit
    )

# Get user's own posts
@router.get("/mydumps", response_model=PostListResponse)
async def get_my_posts(
    token: str = Query(..., description="User token"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Post).filter(Post.user_token == token)
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return PostListResponse(
        posts=posts,
        total=total,
        page=page,
        limit=limit
    )

# Update a post
@router.patch("/post/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_update: PostUpdate,
    token: str = Query(..., description="User token"),
    db: Session = Depends(get_db)
):
    db_post = db.query(Post).filter(Post.id == post_id, Post.user_token == token).first()
    
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found or not authorized")
    
    update_data = post_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_post, field, value)
    
    db.commit()
    db.refresh(db_post)
    return db_post

# Delete a post
@router.delete("/post/{post_id}")
async def delete_post(
    post_id: int,
    token: str = Query(..., description="User token"),
    db: Session = Depends(get_db)
):
    db_post = db.query(Post).filter(Post.id == post_id, Post.user_token == token).first()
    
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found or not authorized")
    
    db.delete(db_post)
    db.commit()
    return {"message": "Post deleted successfully"}

# React to a post
@router.post("/post/{post_id}/react")
@limiter.limit("100/hour")
async def react_to_post(
    request: Request,
    post_id: int,
    reaction: str = Query(..., description="Reaction type"),
    token: str = Query(..., description="User token"),
    db: Session = Depends(get_db)
):
    print(f"Reacting to post {post_id} with reaction {reaction} by user {token}")
    
    db_post = db.query(Post).filter(Post.id == post_id).first()
    
    if not db_post:
        print(f"Post {post_id} not found")
        raise HTTPException(status_code=404, detail="Post not found")
    
    print(f"Found post: {db_post.id}, current reactions: {db_post.reactions}")
    
    # Initialize reactions if not exists
    if not db_post.reactions:
        db_post.reactions = {
            "thumbs_up": 0,
            "heart": 0,
            "laugh": 0,
            "angry": 0
        }
        print("Initialized reactions")
    
    # For now, implement a simple toggle system (1 like per user per post)
    # In a real app, you'd have a separate user_reactions table
    current_count = db_post.reactions.get(reaction, 0)
    new_reactions = db_post.reactions.copy()
    
    # Simple toggle: if count is 0, make it 1; if 1 or more, make it 0
    # This prevents unlimited likes but isn't perfect (multiple users can still like)
    if current_count == 0:
        new_reactions[reaction] = 1
        print(f"Added reaction {reaction}: 0 -> 1")
    else:
        new_reactions[reaction] = 0
        print(f"Removed reaction {reaction}: {current_count} -> 0")
    
    # Update the reactions field with a new dictionary to trigger SQLAlchemy change detection
    db_post.reactions = new_reactions
    
    db.commit()
    db.refresh(db_post)
    
    print(f"Final reactions: {db_post.reactions}")
    return db_post

