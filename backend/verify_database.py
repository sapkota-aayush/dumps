#!/usr/bin/env python3
"""
Script to verify database tables and data for scan tracking and wild thoughts.
"""
import os
import sys
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, SessionLocal
from app.models.models import ScanTracker, WildThought, Post

load_dotenv()

def verify_tables():
    """Check if all required tables exist."""
    print("=" * 60)
    print("DATABASE VERIFICATION")
    print("=" * 60)
    print()
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    
    required_tables = ['posts', 'scan_tracker', 'wild_thoughts']
    
    print("📋 Checking tables...")
    print()
    
    for table in required_tables:
        if table in tables:
            print(f"  ✅ {table} - EXISTS")
        else:
            print(f"  ❌ {table} - NOT FOUND")
    
    print()
    return all(table in tables for table in required_tables)

def verify_data():
    """Check data in the tables."""
    db: Session = SessionLocal()
    
    try:
        print("=" * 60)
        print("DATA VERIFICATION")
        print("=" * 60)
        print()
        
        # Check scan_tracker
        scan_count = db.query(ScanTracker).count()
        print(f"📊 Scan Tracker:")
        print(f"   Total scans: {scan_count}")
        
        if scan_count > 0:
            latest_scan = db.query(ScanTracker).order_by(ScanTracker.created_at.desc()).first()
            print(f"   Latest scan: ID {latest_scan.id} at {latest_scan.created_at}")
            print(f"   IP: {latest_scan.ip_address or 'N/A'}")
        
        print()
        
        # Check wild_thoughts
        wt_count = db.query(WildThought).count()
        print(f"💭 Wild Thoughts:")
        print(f"   Total thoughts: {wt_count}")
        
        if wt_count > 0:
            latest_thought = db.query(WildThought).order_by(WildThought.created_at.desc()).first()
            print(f"   Latest thought: ID {latest_thought.id} at {latest_thought.created_at}")
            preview = latest_thought.content[:50] + "..." if len(latest_thought.content) > 50 else latest_thought.content
            print(f"   Preview: {preview}")
        
        print()
        
        # Check posts (existing table)
        post_count = db.query(Post).count()
        print(f"📝 Posts:")
        print(f"   Total posts: {post_count}")
        
        print()
        
        # Show recent scans
        if scan_count > 0:
            print("=" * 60)
            print("RECENT SCANS (Last 5)")
            print("=" * 60)
            recent_scans = db.query(ScanTracker).order_by(ScanTracker.created_at.desc()).limit(5).all()
            for i, scan in enumerate(recent_scans, 1):
                print(f"{i}. ID: {scan.id} | Created: {scan.created_at} | IP: {scan.ip_address or 'N/A'}")
            print()
        
        # Show recent wild thoughts
        if wt_count > 0:
            print("=" * 60)
            print("RECENT WILD THOUGHTS (Last 3)")
            print("=" * 60)
            recent_thoughts = db.query(WildThought).order_by(WildThought.created_at.desc()).limit(3).all()
            for i, thought in enumerate(recent_thoughts, 1):
                preview = thought.content[:100] + "..." if len(thought.content) > 100 else thought.content
                print(f"{i}. ID: {thought.id} | Created: {thought.created_at}")
                print(f"   Content: {preview}")
                print()
        
    except Exception as e:
        print(f"❌ Error checking data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def check_table_structure():
    """Check the structure of the tables."""
    db: Session = SessionLocal()
    
    try:
        print("=" * 60)
        print("TABLE STRUCTURES")
        print("=" * 60)
        print()
        
        inspector = inspect(engine)
        
        tables_to_check = ['scan_tracker', 'wild_thoughts']
        
        for table_name in tables_to_check:
            if table_name in inspector.get_table_names():
                print(f"📋 {table_name}:")
                columns = inspector.get_columns(table_name)
                for col in columns:
                    nullable = "NULL" if col['nullable'] else "NOT NULL"
                    print(f"   - {col['name']}: {col['type']} ({nullable})")
                print()
        
    except Exception as e:
        print(f"❌ Error checking table structure: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print()
    tables_exist = verify_tables()
    print()
    
    if tables_exist:
        verify_data()
        print()
        check_table_structure()
        print()
        print("=" * 60)
        print("✅ VERIFICATION COMPLETE")
        print("=" * 60)
    else:
        print("⚠️  Some tables are missing. Make sure the backend has been started at least once.")
        print("   Tables are created automatically when the FastAPI app starts.")
    
    print()

