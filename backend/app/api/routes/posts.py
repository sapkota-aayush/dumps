from fastapi import APIRouter, Depends, HTTPException, Query, Request, File, UploadFile
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.database import get_db
from app.models.models import Post
from app.schemas.schemas import PostCreate, PostUpdate, PostResponse, PostListResponse
from typing import List, Optional
import uuid
import os
import shutil
from datetime import datetime
import boto3
from pydantic import BaseModel

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# S3 client setup
def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
        region_name=os.getenv('AWS_REGION')
    )

# Pydantic model for presigned URL request
class PresignedUrlRequest(BaseModel):
    filename: str
    content_type: str = "image/jpeg"

# Pydantic model for presigned URL response
class PresignedUrlResponse(BaseModel):
    upload_url: str
    image_url: str

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
async def get_posts(
    request: Request,
    hashtag: Optional[str] = Query(None, description="Filter by hashtag"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Posts per page"),
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
    limit: int = Query(20, ge=1, le=100),
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

# Upload image
@router.post("/upload-image")
@limiter.limit("10/hour")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload an image file and return the URL"""
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 5MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    if file_size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    # Return the URL path
    image_url = f"/uploads/{unique_filename}"
    return {"image_url": image_url, "message": "Image uploaded successfully"}

# Get presigned URL for S3 upload
@router.post("/upload/presigned-url", response_model=PresignedUrlResponse)
@limiter.limit("50/hour")
async def get_presigned_url(request: Request, presigned_request: PresignedUrlRequest):
    """Generate a presigned URL for direct S3 upload"""
    try:
        s3_client = get_s3_client()
        bucket_name = os.getenv('S3_BUCKET_NAME')
        
        # Generate unique filename
        file_extension = os.path.splitext(presigned_request.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        s3_key = f"images/{unique_filename}"
        
        # Generate presigned URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': s3_key,
                'ContentType': presigned_request.content_type
            },
            ExpiresIn=3600  # 1 hour
        )
        
        # Generate the public URL for the uploaded file
        image_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{s3_key}"
        
        return PresignedUrlResponse(
            upload_url=presigned_url,
            image_url=image_url
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

