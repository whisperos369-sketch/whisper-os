# Quickstart

## Windows
1. Clone the repository
   ```powershell
   git clone <repo>
   cd whisper-os
   ```
2. Copy environment template
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
    pnpm test
    pnpm run build
   ```
5. Start development servers
   ```powershell
   .\scripts\dev.ps1
   ```
6. Visit UI at http://localhost:5173 and API health at http://localhost:8080/api/system/health

## Linux / macOS
1. Clone repository
   ```bash
   git clone <repo>
   cd whisper-os
   python -m venv .venv
   source .venv/bin/activate
    pip install -r api/requirements.txt
    pnpm install
   ```
2. Copy environment template
   ```bash
   cp .env.example .env.local
   ```
3. Verify installation
   ```bash
    pytest
    pnpm test
    pnpm run build
   ```
4. Start servers
   ```bash
    uvicorn api.app.main:app --reload --port 8080 &
    pnpm run dev
   ```

