import json
import re
import traceback
from datetime import datetime
from services.llm import LLMService
from services.storage import StorageService
from database import get_supabase

class ParserService:
    def __init__(self):
        self.llm = LLMService()
        self.storage = StorageService()
        self.supabase = get_supabase()

    def _extract_json(self, text: str) -> dict:
        """Extracts JSON object from a string that might contain Markdown code blocks."""
        try:
            match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
            if match:
                json_str = match.group(1)
            else:
                match = re.search(r"(\{.*\})", text, re.DOTALL)
                if match:
                    json_str = match.group(1)
                else:
                    json_str = text
            return json.loads(json_str)
        except Exception as e:
            print(f"[Parser] JSON Extraction Error: {e}")
            print(f"[Parser] Raw text (first 500 chars): {text[:500]}")
            return {}

    def _normalize_date(self, date_str):
        """Convert various Chinese date formats to ISO format (YYYY-MM-DD)."""
        if not date_str or date_str == "":
            return None
        
        try:
            date_str = str(date_str).strip()
            
            # Chinese format: 2024年7月15日
            match = re.match(r'(\d{4})年(\d{1,2})月(\d{1,2})日', date_str)
            if match:
                year, month, day = match.groups()
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
            
            # Already in ISO format
            if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                return date_str
            
            # Slash format
            if re.match(r'\d{4}/\d{1,2}/\d{1,2}', date_str):
                parts = date_str.split('/')
                return f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
            
            print(f"[Parser] Warning: Could not parse date: {date_str}")
            return None
        except Exception as e:
            print(f"[Parser] Date normalization error: {e}")
            return None

    def _safe_float(self, value):
        """Safely convert value to float, return None if fails."""
        if value is None or value == "":
            return None
        try:
            if isinstance(value, str):
                value = value.replace('¥', '').replace('￥', '').replace(',', '').strip()
            return float(value)
        except:
            return None

    def parse_document(self, document_id: str):
        """
        Parse document and save extraction results for user review.
        Does NOT save to final tables - waits for user approval.
        """
        print(f"\n[Parser] ========== Starting parse for document {document_id} ==========")
        
        try:
            # 1. Get Document
            print(f"[Parser] Step 1: Fetching document from database...")
            doc_response = self.supabase.table("documents").select("*").eq("id", document_id).execute()
            if not doc_response.data:
                raise ValueError(f"Document {document_id} not found in database")
            doc = doc_response.data[0]
            print(f"[Parser] Document found: {doc['name']}, status: {doc['status']}")
            
            # Update status to processing
            print(f"[Parser] Step 2: Updating status to 'processing'...")
            self.supabase.table("documents").update({"status": "processing"}).eq("id", document_id).execute()
            
            # 2. Get URL
            print(f"[Parser] Step 3: Getting public URL for storage path: {doc['storage_path']}")
            file_url = self.storage.get_public_url(doc["storage_path"])
            print(f"[Parser] Public URL: {file_url}")
            
            # 3. Analyze with LLM
            print(f"[Parser] Step 4: Calling LLM for analysis...")
            system_prompt = "You are an expert financial document analyzer. Extract structured data with high precision. Output ONLY valid JSON."
            
            prompt = """
分析这张图片。
1. 识别文档类型: 'invoice'(发票), 'contract'(合同), 'bank_statement'(银行流水), 'payroll_record'(工资单), 或 'other'(其他)。
2. 根据类型提取相关字段。

如果是 'invoice': 提取 {invoice_code, invoice_number, total_amount_tax_included, items: [{item_name, amount}]}
如果是 'contract': 提取 {contract_no, title, party_a, party_b, total_amount, start_date, end_date, contract_type}
如果是 'bank_statement': 提取 {account_name, account_number, bank_name, currency, transactions: [{transaction_date, counterparty_name, debit_amount, credit_amount, summary}]}
如果是 'payroll_record': 提取 {employee_id, pay_period, base_salary, position_subsidy, total_deductions, net_pay}

返回JSON对象:
{
    "type": "...",
    "data": { ... }
}
"""
            
            llm_response = self.llm.analyze_image(prompt, file_url, system_prompt)
            print(f"[Parser] LLM Response received (length: {len(llm_response)})")
            print(f"[Parser] LLM Response: {llm_response[:1000]}")
            
            parsed_data = self._extract_json(llm_response)
            print(f"[Parser] Parsed JSON: {json.dumps(parsed_data, ensure_ascii=False, indent=2)}")
            
            doc_type = parsed_data.get("type")
            data = parsed_data.get("data", {})
            
            if not doc_type:
                raise ValueError("LLM did not return a document type")
            
            # 4. Save to extraction_results for user review (NEW!)
            print(f"[Parser] Step 5: Saving extraction results for review (type: {doc_type})...")
            
            extraction_result = {
                "document_id": document_id,
                "doc_type": doc_type,
                "extracted_data": data,
                "status": "pending_review"
            }
            
            result = self.supabase.table("extraction_results").insert(extraction_result).execute()
            extraction_id = result.data[0]["id"]
            print(f"[Parser] Extraction result saved with ID: {extraction_id}")
            
            # Update Document Status to 'extracted' (waiting for review)
            print(f"[Parser] Step 6: Updating document status to 'extracted'...")
            self.supabase.table("documents").update({
                "status": "extracted",
                "file_type": doc_type
            }).eq("id", document_id).execute()
            
            print(f"[Parser] ========== Parse completed, awaiting user review ==========\n")
            return {
                "extraction_id": extraction_id,
                "doc_type": doc_type,
                "data": data
            }
            
        except Exception as e:
            error_msg = str(e)
            error_trace = traceback.format_exc()
            print(f"[Parser] ========== ERROR parsing document {document_id} ==========")
            print(f"[Parser] Error: {error_msg}")
            print(f"[Parser] Traceback:\n{error_trace}")
            print(f"[Parser] ================================================================\n")
            
            # Update status to error
            self.supabase.table("documents").update({
                "status": "error",
                "error_message": error_msg[:500]
            }).eq("id", document_id).execute()
            
            raise e

    def approve_extraction(self, extraction_id: str, user_corrections: dict = None):
        """
        Approve extraction and save to final tables.
        Called after user reviews and approves the data.
        """
        print(f"\n[Parser] ========== Approving extraction {extraction_id} ==========")
        
        try:
            # Get extraction result
            result = self.supabase.table("extraction_results").select("*").eq("id", extraction_id).execute()
            if not result.data:
                raise ValueError(f"Extraction {extraction_id} not found")
            
            extraction = result.data[0]
            doc_type = extraction["doc_type"]
            data = user_corrections if user_corrections else extraction["extracted_data"]
            document_id = extraction["document_id"]
            
            # Get company_id from document
            doc = self.supabase.table("documents").select("company_id").eq("id", document_id).execute()
            company_id = doc.data[0]["company_id"]
            
            print(f"[Parser] Saving approved data to {doc_type} table...")
            
            # Save to appropriate table
            if doc_type == "invoice":
                self._save_invoice(company_id, document_id, data)
            elif doc_type == "contract":
                self._save_contract(company_id, document_id, data)
            elif doc_type == "bank_statement":
                self._save_bank_statement(company_id, document_id, data)
            elif doc_type == "payroll_record":
                self._save_payroll(company_id, document_id, data)
            
            # Update extraction status
            self.supabase.table("extraction_results").update({
                "status": "approved",
                "user_corrections": user_corrections,
                "reviewed_at": datetime.now().isoformat()
            }).eq("id", extraction_id).execute()
            
            # Update document status
            self.supabase.table("documents").update({
                "status": "parsed"
            }).eq("id", document_id).execute()
            
            print(f"[Parser] ========== Approval completed ==========\n")
            return {"status": "success"}
            
        except Exception as e:
            print(f"[Parser] Approval error: {e}")
            raise e

    def _save_invoice(self, company_id, document_id, data):
        print(f"[Parser] Saving invoice data...")
        invoice_data = {
            "company_id": company_id,
            "document_id": document_id,
            "invoice_code": data.get("invoice_code"),
            "invoice_number": data.get("invoice_number"),
            "total_amount_tax_included": self._safe_float(data.get("total_amount_tax_included")),
            "verification_status": "pending"
        }
        res = self.supabase.table("invoices").insert(invoice_data).execute()
        print(f"[Parser] Invoice saved with ID: {res.data[0]['id']}")

    def _save_contract(self, company_id, document_id, data):
        print(f"[Parser] Saving contract data...")
        contract_data = {
            "company_id": company_id,
            "document_id": document_id,
            "contract_no": data.get("contract_no"),
            "title": data.get("title"),
            "party_a": data.get("party_a"),
            "party_b": data.get("party_b"),
            "total_amount": self._safe_float(data.get("total_amount")),
            "start_date": self._normalize_date(data.get("start_date")),
            "end_date": self._normalize_date(data.get("end_date")),
            "contract_type": data.get("contract_type"),
            "verification_status": "pending"
        }
        res = self.supabase.table("contracts").insert(contract_data).execute()
        print(f"[Parser] Contract saved with ID: {res.data[0]['id']}")

    def _save_bank_statement(self, company_id, document_id, data):
        print(f"[Parser] Saving bank statement data...")
        transactions = data.get("transactions", [])
        for txn in transactions:
            self.supabase.table("bank_statements").insert({
                "company_id": company_id,
                "document_id": document_id,
                "transaction_date": self._normalize_date(txn.get("transaction_date")),
                "counterparty_name": txn.get("counterparty_name"),
                "debit_amount": self._safe_float(txn.get("debit_amount")),
                "credit_amount": self._safe_float(txn.get("credit_amount")),
                "summary": txn.get("summary"),
                "account_number": data.get("account_number"),
                "account_name": data.get("account_name"),
                "bank_name": data.get("bank_name"),
                "currency": data.get("currency", "CNY")
            }).execute()
        print(f"[Parser] Saved {len(transactions)} bank transactions")

    def _save_payroll(self, company_id, document_id, data):
        print(f"[Parser] Saving payroll data...")
        res = self.supabase.table("payroll_records").insert({
            "company_id": company_id,
            "document_id": document_id,
            "employee_id": data.get("employee_id"),
            "pay_period": data.get("pay_period"),
            "base_salary": self._safe_float(data.get("base_salary")),
            "position_subsidy": self._safe_float(data.get("position_subsidy")),
            "total_deductions": self._safe_float(data.get("total_deductions")),
            "net_pay": self._safe_float(data.get("net_pay"))
        }).execute()
        print(f"[Parser] Payroll record saved with ID: {res.data[0]['id']}")
