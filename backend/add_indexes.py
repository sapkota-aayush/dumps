#!/usr/bin/env python3
"""
Simple script to add database indexes for better performance
"""
from sqlalchemy import create_engine, text
from app.core.database import DATABASE_URL

def add_indexes():
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as conn:
        # Add index on created_at for faster ordering
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)"))
        
        # Add index on hashtag for faster filtering
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_posts_hashtag ON posts(hashtag)"))
        
        # Add index on user_token for faster user post queries
        conn.execute(text("CREATE INDEX IF NOT EXISTS idx_posts_user_token ON posts(user_token)"))
    
    print("✅ Database indexes added successfully!")

if __name__ == "__main__":
    add_indexes()
