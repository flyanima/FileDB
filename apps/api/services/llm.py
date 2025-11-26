import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import requests

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

from database import get_supabase

class LLMService:
    def __init__(self):
        self.api_key = None
        self.base_url = None
        self.model = None
        
        # 1. Try to get active provider from DB
        try:
            supabase = get_supabase()
            response = supabase.table("llm_providers").select("*").eq("is_active", True).single().execute()
            if response.data:
                provider = response.data
                self.api_key = provider.get("api_key")
                self.base_url = provider.get("base_url")
                self.model = provider.get("selected_model")
                print(f"[LLM] Loaded active provider from DB: {provider.get('name')}")
        except Exception as e:
            print(f"[LLM] Warning: Could not fetch provider from DB: {e}")

        # 2. Fallback to environment variables
        if not self.api_key:
            print("[LLM] Fallback to environment variables")
            self.api_key = os.environ.get("OPENROUTER_API_KEY")
            self.base_url = os.environ.get("OPENROUTER_BASE_URL")
            self.model = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

        if not self.api_key:
            raise ValueError("No active LLM provider found in DB and OPENROUTER_API_KEY not set in env")
        
        # Ensure model is set
        if not self.model:
            self.model = "google/gemini-2.0-flash-001" # Default fallback
            
        print(f"[LLM] Initializing with model: {self.model}")
        print(f"[LLM] Base URL: {self.base_url}")
        
        self.client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
        )

    def generate_text(self, prompt: str, system_prompt: str = "You are a helpful financial assistant.") -> str:
        try:
            print(f"[LLM] Generating text (prompt length: {len(prompt)})")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            result = response.choices[0].message.content
            print(f"[LLM] Text generation successful (response length: {len(result)})")
            return result
        except Exception as e:
            print(f"[LLM] Text generation error: {e}")
            raise e

    def analyze_image(self, prompt: str, image_url: str, system_prompt: str = "You are a helpful financial assistant.") -> str:
        """
        Analyze an image using multimodal LLM.
        Downloads the image and sends it as base64 to avoid URL access issues.
        """
        try:
            print(f"[LLM] Analyzing image: {image_url}")
            print(f"[LLM] Downloading image...")
            
            # Download the image
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            image_bytes = response.content
            print(f"[LLM] Image downloaded ({len(image_bytes)} bytes)")
            
            # Encode to base64
            image_base64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Detect mime type from URL or content
            mime_type = "image/jpeg"  # default
            if image_url.lower().endswith('.png'):
                mime_type = "image/png"
            elif image_url.lower().endswith('.pdf'):
                mime_type = "application/pdf"
            
            print(f"[LLM] Image encoded to base64 (mime: {mime_type})")
            print(f"[LLM] Sending to LLM (prompt length: {len(prompt)})")
            
            # Send to LLM with base64 data URL
            llm_response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ]
            )
            
            result = llm_response.choices[0].message.content
            print(f"[LLM] Image analysis successful (response length: {len(result)})")
            return result
            
        except Exception as e:
            print(f"[LLM] Image analysis error: {e}")
            print(f"[LLM] Error type: {type(e).__name__}")
            import traceback
            print(f"[LLM] Traceback:\n{traceback.format_exc()}")
            raise e
