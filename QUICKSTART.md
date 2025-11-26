# FinSight AI - Quick Start Guide

## 🚀 Servers Running

Both servers are now running:

- **Frontend**: http://localhost:3002
- **Backend API**: http://127.0.0.1:8000

## 📋 Getting Started

### Step 1: Create a Company

1. Open http://localhost:3002 in your browser
2. You'll see a welcome message asking you to create a company
3. Click the **"+"** button in the header (top right)
4. Fill in:
   - **Name**: e.g., "My Test Company"
   - **Tax ID**: e.g., "123456789"
5. Click **"Create"**

### Step 2: Upload a Test Document

1. Go to the **Dashboard** (should be the default page)
2. Click **"Upload Document"**
3. Select a file (PDF, image, Excel, or CSV)
4. Wait for the success notification
5. The file is now in Supabase Storage!

### Step 3: Test the Data Grids

1. Click **"Invoices"** in the sidebar
2. Click **"Add Row"** to create a new invoice
3. Click **"Edit"** on the new row
4. Fill in some test data:
   - Code: `INV-001`
   - Number: `2024-001`
   - Total Amount: `1000`
   - Status: `pending`
5. Click **"Save"**
6. Refresh the page to verify data persisted

### Step 4: Try Other Pages

Navigate through the sidebar to explore:
- **Contracts** - Manage contract records
- **Bank Statements** - View transactions
- **Payroll** - Employee payroll data
- **Settings** - Configuration (placeholder)

## 🧪 Testing AI Parsing (Advanced)

To test the AI document parsing:

1. Upload a document via the Dashboard
2. Note the document ID from the database or console
3. Use the API to trigger parsing:

```bash
# Get the document ID from Supabase or browser console
curl -X POST http://127.0.0.1:8000/documents/{document_id}/parse
```

4. Check the Invoices or Contracts page to see extracted data

## 🔍 Troubleshooting

### No Companies Showing
- Check Supabase connection in browser console
- Verify `.env.local` has correct Supabase credentials

### Upload Fails
- Ensure Supabase Storage bucket `raw-files` exists
- Check browser console for errors

### Data Not Saving
- Verify Supabase tables exist (run migration SQL)
- Check network tab for API errors

## 📊 Database Setup Reminder

If you haven't already, apply the Phase 2 migration:

1. Open Supabase SQL Editor
2. Copy content from `supabase/migrations/20251125_phase2_documents.sql`
3. Run the SQL

## 🎯 What to Test

- [x] Company creation and switching
- [x] File upload to Storage
- [x] Data grid editing and saving
- [x] Navigation between pages
- [ ] AI document parsing (requires manual API call)
- [ ] Multiple companies (create 2+ and switch between them)

## 🔗 Useful Links

- Frontend: http://localhost:3002
- API Docs: http://127.0.0.1:8000/docs
- Supabase Dashboard: https://supabase.com/dashboard

Enjoy testing FinSight AI! 🎉
