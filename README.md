# FileDB (FinSight AI)

A modern financial data management platform built with **Next.js**, **Supabase**, and **FastAPI**.

## Features
- Multi‑Company Management (company context, switcher, secure config)
- Document upload, OCR parsing, and extraction workflow
- Dashboard with real‑time status and data isolation per company
- Initial setup modal for first‑time company creation
- Secure handling of environment variables (`.env.example` provided, `.gitignore` protects secrets)

## Getting Started
1. Clone the repository:
   ```bash
   git clone https://github.com/flyanima/FileDB.git
   cd FileDB
   ```
2. Install dependencies:
   ```bash
   npm install   # for the web app
   pip install -r apps/api/requirements.txt   # for the API
   ```
3. Create a local environment file:
   ```bash
   cp .env.example .env.local
   # Fill in your Supabase URL, keys, and any other API keys.
   ```
4. Run the development servers:
   ```bash
   # Web app
   cd apps/web && npm run dev
   # API (FastAPI)
   cd apps/api && uvicorn main:app --reload
   ```

## Contributing
- Ensure you **do not** commit any `.env*` files; they are ignored via `.gitignore`.
- Follow the code style guidelines in the repository.
- Open a pull request with a clear description of changes.

## License
MIT License – see `LICENSE` for details.
