# Quickstart

## Windows
1. Clone the repository
   ```powershell
   git clone <repo>
   cd whisper-os
   ```
2. Run setup script
   ```powershell
   .\scripts\setup.ps1
   ```
3. Start development servers
   ```powershell
   .\scripts\dev.ps1
   ```
4. Visit UI at http://localhost:5173 and API health at http://localhost:8080/api/system/health

## Linux / macOS
1. Clone repository
   ```bash
   git clone <repo>
   cd whisper-os
   python -m venv .venv
   source .venv/bin/activate
   pip install -r api/requirements.txt
   npm install
   ```
2. Start servers
   ```bash
   uvicorn api.app.main:app --reload --port 8080 &
   npm run dev
   ```
