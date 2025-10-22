from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Schema for creating a new post
class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None
    hashtag: str
    user_token: str
    fictional_name: Optional[str] = "Anonymous"

# Schema for updating a post
class PostUpdate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None
    hashtag: Optional[str] = None
    fictional_name: Optional[str] = None

# Schema for post response
class PostResponse(BaseModel):
    id: int
    content: str
    image_url: Optional[str]
    hashtag: str
    created_at: datetime
    user_token: str
    fictional_name: str
    reactions: Dict[str, int]
    
    class Config:
        from_attributes = True

# Schema for post list response
class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    limit: int