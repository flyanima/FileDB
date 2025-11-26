from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from database import get_supabase
from services.llm import LLMService
import os

router = APIRouter(prefix="/llm", tags=["llm"])

class LLMProviderCreate(BaseModel):
    name: str
    base_url: str
    api_key: str
    selected_model: Optional[str] = None

class LLMProviderUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    selected_model: Optional[str] = None

class TestConnectionRequest(BaseModel):
    base_url: str
    api_key: str

@router.get("/providers")
async def get_providers():
    try:
        supabase = get_supabase()
        # Select all fields except api_key for security (or mask it)
        # For MVP we might return it but it's bad practice. Let's return a masked version.
        response = supabase.table("llm_providers").select("*").order("created_at").execute()
        
        providers = []
        for p in response.data:
            # Simple masking
            masked_key = p["api_key"][:4] + "..." + p["api_key"][-4:] if p["api_key"] and len(p["api_key"]) > 8 else "***"
            p["api_key_masked"] = masked_key
            # We don't send the full key back to client list usually, but for editing we might need it?
            # For now let's send the real key too because the frontend might need to pre-fill the edit form.
            # In a real prod app we wouldn't send it back.
            providers.append(p)
            
        return {"status": "success", "data": providers}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/providers")
async def create_provider(provider: LLMProviderCreate):
    try:
        supabase = get_supabase()
        
        # If this is the first provider, make it active
        count_res = supabase.table("llm_providers").select("count", count="exact").execute()
        is_first = count_res.count == 0
        
        data = {
            "name": provider.name,
            "base_url": provider.base_url,
            "api_key": provider.api_key,
            "selected_model": provider.selected_model,
            "is_active": is_first
        }
        
        response = supabase.table("llm_providers").insert(data).execute()
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/providers/{provider_id}")
async def update_provider(provider_id: str, provider: LLMProviderUpdate):
    try:
        supabase = get_supabase()
        
        data = {}
        if provider.name: data["name"] = provider.name
        if provider.base_url: data["base_url"] = provider.base_url
        if provider.api_key: data["api_key"] = provider.api_key
        if provider.selected_model: data["selected_model"] = provider.selected_model
        
        data["updated_at"] = "now()"
        
        response = supabase.table("llm_providers").update(data).eq("id", provider_id).execute()
        return {"status": "success", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/providers/{provider_id}")
async def delete_provider(provider_id: str):
    try:
        supabase = get_supabase()
        # Check if active
        current = supabase.table("llm_providers").select("is_active").eq("id", provider_id).single().execute()
        if current.data and current.data["is_active"]:
            raise HTTPException(status_code=400, detail="Cannot delete the active provider. Please activate another one first.")
            
        supabase.table("llm_providers").delete().eq("id", provider_id).execute()
        return {"status": "success", "message": "Provider deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/providers/{provider_id}/activate")
async def activate_provider(provider_id: str):
    try:
        supabase = get_supabase()
        
        # Deactivate all
        supabase.table("llm_providers").update({"is_active": False}).neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        # Activate target
        response = supabase.table("llm_providers").update({"is_active": True}).eq("id", provider_id).execute()
        
        return {"status": "success", "message": "Provider activated", "data": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test")
async def test_connection(request: TestConnectionRequest):
    """
    Test connection to LLM provider and fetch available models.
    This acts as a proxy to avoid CORS issues from frontend.
    """
    try:
        # Try to list models using OpenAI client structure
        from openai import OpenAI
        
        client = OpenAI(
            base_url=request.base_url,
            api_key=request.api_key,
        )
        
        models = client.models.list()
        model_list = [m.id for m in models.data]
        
        return {"status": "success", "models": model_list}
    except Exception as e:
        print(f"Connection test failed: {e}")
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")
