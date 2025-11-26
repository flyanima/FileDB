import os
from openai import OpenAI
from dotenv import load_dotenv
import base64
import requests

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = os.environ.get("OPENROUTER_BASE_URL")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

class LLMService:
    def __init__(self):
        if not OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not found in environment variables")
        
        print(f"[LLM] Initializing with model: {OPENROUTER_MODEL}")
        print(f"[LLM] Base URL: {OPENROUTER_BASE_URL}")
        
        self.client = OpenAI(
            base_url=OPENROUTER_BASE_URL,
            api_key=OPENROUTER_API_KEY,
        )

    def generate_text(self, prompt: str, system_prompt: str = "You are a helpful financial assistant.") -> str:
        try:
            print(f"[LLM] Generating text (prompt length: {len(prompt)})")
            response = self.client.chat.completions.create(
                model=OPENROUTER_MODEL,
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
                model=OPENROUTER_MODEL,
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
