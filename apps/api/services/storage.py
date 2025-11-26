from supabase import Client
from database import get_supabase
import uuid

BUCKET_NAME = "raw-files"

class StorageService:
    def __init__(self):
        self.supabase: Client = get_supabase()

    def upload_file(self, file_content: bytes, file_name: str, content_type: str, company_id: str) -> str:
        """
        Uploads a file to Supabase Storage and returns the path.
        """
        # Generate unique path: company_id/uuid_filename
        file_ext = file_name.split('.')[-1] if '.' in file_name else 'bin'
        unique_name = f"{uuid.uuid4()}.{file_ext}"
        path = f"{company_id}/{unique_name}"
        
        try:
            # Upload to storage
            self.supabase.storage.from_(BUCKET_NAME).upload(
                path=path,
                file=file_content,
                file_options={"content-type": content_type, "upsert": "false"}
            )
            return path
        except Exception as e:
            print(f"Storage upload error: {e}")
            # If file exists, try with different name
            unique_name = f"{uuid.uuid4()}_retry.{file_ext}"
            path = f"{company_id}/{unique_name}"
            self.supabase.storage.from_(BUCKET_NAME).upload(
                path=path,
                file=file_content,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            return path

    def get_public_url(self, path: str) -> str:
        """Get public URL for a file in storage"""
        return self.supabase.storage.from_(BUCKET_NAME).get_public_url(path)
