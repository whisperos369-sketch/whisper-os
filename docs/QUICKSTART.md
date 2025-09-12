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
3. Verify installation
   ```powershell
   pytest
   npm run build
   ```
4. Start development servers
   ```powershell
   .\scripts\dev.ps1
   ```
5. Visit UI at http://localhost:5173 and API health at http://localhost:8080/api/system/health

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
2. Verify installation
   ```bash
   pytest
   npm run build
   ```
3. Start servers
   ```bash
   uvicorn api.app.main:app --reload --port 8080 &
   npm run dev
   ```
