"""
Test script to manually trigger document parsing and see detailed logs
"""
import sys
sys.path.append('.')

from services.parser import ParserService

# Document ID from the database
document_id = "d0e7750a-2f8b-432b-a00f-975a1b5c5e38"

print(f"Starting manual parse test for document: {document_id}")
print("=" * 80)

try:
    parser = ParserService()
    result = parser.parse_document(document_id)
    print("\n" + "=" * 80)
    print("SUCCESS!")
    print(f"Result: {result}")
except Exception as e:
    print("\n" + "=" * 80)
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
