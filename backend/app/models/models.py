from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    hashtag = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_token = Column(String(36), nullable=False)
    fictional_name = Column(String(50), nullable=True, default="Anonymous")
    reactions = Column(JSON, nullable=True, default={
        "thumbs_up": 0,
        "heart": 0,
        "laugh": 0,
        "angry": 0
    })
