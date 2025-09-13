# Quickstart

## Windows
1. Clone the repository
   ```powershell
   git clone <repo>
   cd whisper-os
   ```
2. Copy `.env.example` to `.env.local` and edit required keys
   ```powershell
   Copy-Item .env.example .env.local
   ```
3. Run setup script
   ```powershell
   .\scripts\setup.ps1
   ```
4. Verify installation
   ```powershell
   pytest
   npm run build
   ```
5. Start development servers
   ```powershell
   .\scripts\dev.ps1
   ```
6. In another terminal, start the Celery worker
   ```powershell
   .\scripts\worker.ps1
   ```
7. Visit UI at http://localhost:5173 and API health at http://localhost:8080/api/system/health

## Linux / macOS
1. Clone repository
   ```bash
   git clone <repo>
   cd whisper-os
   cp .env.example .env.local
   python -m venv .venv
   source .venv/bin/activate
   pip install -r api/requirements.txt
   npm install
   ```
2. Verify installation
   ```bash
   pytest
   npm run build
   ```
3. Start servers (run each in its own shell)
   ```bash
   uvicorn api.app.main:app --reload --port 8080 &
   ./scripts/worker.sh &
   npm run dev
   ```
