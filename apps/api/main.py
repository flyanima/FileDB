from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from database import get_supabase
from services.storage import StorageService
from services.parser import ParserService
from routers import llm_settings
from pydantic import BaseModel
from typing import Optional
import uuid

app = FastAPI(title="FinSight AI API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(llm_settings.router)


class ApprovalRequest(BaseModel):
    extraction_id: str
    user_corrections: Optional[dict] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "FinSight AI API"}

@app.get("/db-check")
def db_check():
    try:
        supabase = get_supabase()
        response = supabase.table("companies").select("count", count="exact").execute()
        return {"status": "connected", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    company_id: str = Form(...)
):
    try:
        storage = StorageService()
        supabase = get_supabase()
        
        # 1. Read file content
        file_content = await file.read()
        
        # 2. Upload to Storage
        storage_path = storage.upload_file(
            file_content=file_content,
            file_name=file.filename,
            content_type=file.content_type or "application/octet-stream",
            company_id=company_id
        )
        
        # 3. Insert into DB
        doc_data = {
            "company_id": company_id,
            "name": file.filename,
            "storage_path": storage_path,
            "file_type": file.content_type,
            "status": "uploaded"
        }
        
        response = supabase.table("documents").insert(doc_data).execute()
        
        return {"status": "success", "document": response.data[0]}
        
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/{document_id}/parse")
async def parse_document(document_id: str, background_tasks: BackgroundTasks):
    try:
        parser = ParserService()
        # Run parsing in background
        background_tasks.add_task(parser.parse_document, document_id)
        return {"status": "processing", "message": "Document parsing started in background"}
    except Exception as e:
        print(f"Parse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}/extraction")
async def get_extraction_result(document_id: str):
    """Get extraction results for user review"""
    try:
        supabase = get_supabase()
        result = supabase.table("extraction_results").select("*").eq("document_id", document_id).eq("status", "pending_review").execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="No pending extraction found for this document")
        
        return {"status": "success", "extraction": result.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Get extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extractions/approve")
async def approve_extraction(request: ApprovalRequest):
    """Approve extraction and save to final tables"""
    try:
        parser = ParserService()
        result = parser.approve_extraction(request.extraction_id, request.user_corrections)
        return {"status": "success", "message": "Data approved and saved"}
    except Exception as e:
        print(f"Approval error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def root():
    return {"message": "Welcome to FinSight AI API"}
