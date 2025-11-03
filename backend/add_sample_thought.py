#!/usr/bin/env python3
"""
Script to add a sample wild thought to demonstrate the feature.
"""
import os
import sys
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.models import WildThought
from datetime import datetime

load_dotenv()

def add_sample_thought():
    """Add a sample wild thought to demonstrate the feature."""
    db = SessionLocal()
    
    try:
        # Check if sample thought already exists
        existing = db.query(WildThought).filter(
            WildThought.content.like("%This is a preview%")
        ).first()
        
        if existing:
            print("✅ Sample thought already exists!")
            print(f"   ID: {existing.id}")
            print(f"   Content preview: {existing.content[:50]}...")
            return
        
        # Add sample thought - fun and engaging while making it clear it's a preview
        sample_thought = WildThought(
            content="🔥 PREVIEW MODE 🔥 Testing out this anonymous dump space! Can't wait for launch so I can share my ACTUAL wild thoughts here without anyone knowing it's me. This is going to be the perfect escape valve for college stress! What are you waiting for? Dump yours too! 💭",
            ip_address=None,
            created_at=datetime.now()
        )
        
        db.add(sample_thought)
        db.commit()
        db.refresh(sample_thought)
        
        print("✅ Sample thought added successfully!")
        print(f"   ID: {sample_thought.id}")
        print(f"   Content: {sample_thought.content}")
        print(f"   Created at: {sample_thought.created_at}")
        
    except Exception as e:
        print(f"❌ Error adding sample thought: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print()
    print("=" * 60)
    print("ADDING SAMPLE WILD THOUGHT")
    print("=" * 60)
    print()
    add_sample_thought()
    print()

