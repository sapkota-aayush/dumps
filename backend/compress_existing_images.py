"""
Script to compress all existing images in S3 and update database
"""
import os
import sys
import boto3
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv

# Add app to path
sys.path.insert(0, os.path.dirname(__file__))
from app.models.models import Post
from app.core.database import SessionLocal

# Load environment variables
load_dotenv('.env')

# S3 Configuration
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION')
)
bucket_name = os.getenv('S3_BUCKET_NAME')

def compress_image(image_bytes, max_size_mb=0.3):
    """Compress image to target size"""
    try:
        img = Image.open(BytesIO(image_bytes))
        
        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize if too large
        max_dimension = 1920
        if max(img.size) > max_dimension:
            ratio = max_dimension / max(img.size)
            new_size = tuple(int(dim * ratio) for dim in img.size)
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        # Compress to WebP
        output = BytesIO()
        img.save(output, format='WEBP', quality=85, method=6)
        compressed_bytes = output.getvalue()
        
        # Check size
        size_mb = len(compressed_bytes) / (1024 * 1024)
        print(f"  Original: {len(image_bytes) / (1024 * 1024):.2f} MB -> Compressed: {size_mb:.2f} MB")
        
        return compressed_bytes, 'webp'
    except Exception as e:
        print(f"  Error compressing: {e}")
        return None, None

def compress_all_images():
    """Compress all images in database"""
    db = SessionLocal()
    
    try:
        # Get all posts with images (not GIFs)
        posts_with_images = db.query(Post).filter(
            Post.image_url.isnot(None),
            ~Post.image_url.like('%.gif%')  # Skip GIFs
        ).all()
        
        print(f"\nFound {len(posts_with_images)} posts with images to compress")
        print("=" * 80)
        
        compressed_count = 0
        skipped_count = 0
        error_count = 0
        
        for i, post in enumerate(posts_with_images, 1):
            print(f"\n[{i}/{len(posts_with_images)}] Processing post ID {post.id}")
            print(f"  Current URL: {post.image_url[:80]}...")
            
            try:
                # Download image from S3
                if 'amazonaws.com' in post.image_url:
                    # Extract S3 key from URL
                    s3_key = post.image_url.split('.com/')[-1].split('?')[0]
                    
                    # Check current size
                    try:
                        head_response = s3_client.head_object(Bucket=bucket_name, Key=s3_key)
                        current_size_mb = head_response['ContentLength'] / (1024 * 1024)
                        print(f"  Current size in S3: {current_size_mb:.2f} MB")
                        
                        # Skip if already small
                        if current_size_mb < 0.5:
                            print(f"  ✓ Already optimized (< 0.5 MB), skipping")
                            skipped_count += 1
                            continue
                    except Exception as e:
                        print(f"  Warning: Could not get size: {e}")
                    
                    # Download
                    response = s3_client.get_object(Bucket=bucket_name, Key=s3_key)
                    image_bytes = response['Body'].read()
                    
                    # Compress
                    compressed_bytes, ext = compress_image(image_bytes)
                    
                    if compressed_bytes:
                        # Generate new key
                        import uuid
                        new_key = f"images/{uuid.uuid4()}.{ext}"
                        
                        # Upload compressed version
                        s3_client.put_object(
                            Bucket=bucket_name,
                            Key=new_key,
                            Body=compressed_bytes,
                            ContentType=f'image/{ext}'
                        )
                        
                        # Generate new URL
                        new_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{new_key}"
                        
                        # Update database
                        post.image_url = new_url
                        db.commit()
                        
                        print(f"  ✓ Compressed and updated!")
                        print(f"  New URL: {new_url[:80]}...")
                        compressed_count += 1
                        
                        # Delete old image (optional, commented out for safety)
                        # s3_client.delete_object(Bucket=bucket_name, Key=s3_key)
                    else:
                        print(f"  ✗ Compression failed")
                        error_count += 1
                else:
                    print(f"  ⊘ Not an S3 image, skipping")
                    skipped_count += 1
                    
            except Exception as e:
                print(f"  ✗ Error: {e}")
                error_count += 1
        
        print("\n" + "=" * 80)
        print(f"✅ Compression complete!")
        print(f"  Compressed: {compressed_count}")
        print(f"  Skipped: {skipped_count}")
        print(f"  Errors: {error_count}")
        print(f"  Total: {len(posts_with_images)}")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("🗜️  Image Compression Script")
    print("=" * 80)
    compress_all_images()

