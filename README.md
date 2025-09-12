# Whisper OS Music (Windows Native)

This project is a fully-featured, AI-powered music creation studio designed to run natively on Windows with NVIDIA GPU acceleration. It allows users to generate lyrics, music, and more through a web-based interface, backed by a Python API server.

## Features

- **Windows Native**: No Docker or WSL required. Runs directly on Windows for maximum performance.
- **PowerShell Driven**: Includes scripts for easy installation and development runs.
- **GPU Accelerated**: Leverages native Windows CUDA builds for PyTorch.
- **AI-Powered Generation**:
  - Music Generation (MusicGen Small/Medium/Large) with **Chunked Rendering** for long tracks.
  - Lyrics Generation via a unified LLM Connector (Google Gemini, OpenAI, Claude, Local).
  - Voice Conversion (RVC) (scaffolded)
  - ACE-Step Generation (scaffolded)
- **System Intelligence**: Includes a **VRAM Probe** to check GPU health and recommend appropriate model sizes.
- **Social Publishing**: Connectors for YouTube, TikTok, Facebook/Instagram, SoundCloud and more, with "Post Now" and scheduling capabilities.
- **UI Configuration**: Manage API endpoints and keys directly from a settings panel in the UI.
- **Job Queue**: Asynchronous job handling for reliable, scheduled publishing.
- **Strict Dependency Management**: Uses separate virtual environments and pinned dependencies to avoid conflicts.

## New in this Version

### VRAM Probe
- Use **Settings → VRAM Probe** to confirm GPU and available memory.
- The system will provide a recommendation if the "large" model is viable. This typically requires at least 18 GB of free VRAM (or a 24 GB total capacity card).
- The generation endpoints use this information to auto-fallback to smaller models if necessary, preventing out-of-memory errors.

### Chunked Rendering
- In the **Music** tab, an "Advanced" section allows you to enable chunked rendering.
- This feature is ideal for generating tracks longer than 30 seconds. It works by creating audio in smaller segments (e.g., 8-12 seconds) and seamlessly stitching them together with crossfades.
- This approach avoids VRAM limitations and allows for the creation of demos up to a minute long, depending on configuration.
- For the "Large" model, it is highly recommended to use shorter segments (8–12s) to ensure stability.

## Prerequisites

1.  **NVIDIA GPU**: A CUDA-compatible NVIDIA GPU is required for acceleration.
2.  **NVIDIA Driver**: A recent driver supporting CUDA 12.1.
3.  **Python**: Python 3.11+. Ensure it's added to your PATH during installation.
4.  **Node.js**: Node.js 18+ / 20+.
5.  **Git**: For cloning the repository.
6.  **FFmpeg**: Must be installed and available in your system's PATH.
7.  **`py` command**: Ensure the Python launcher for Windows is installed and accessible.

## Setup & Running

1.  **Clone the repository:**
    ```powershell
    git clone <repository_url>
    cd <project_directory>
    ```

2.  **Configure Environment Variables:**
    - Open `.env.local` and replace `REPLACE_WITH_YOUR_KEY` with your Google Gemini API key. Other keys can be configured later via the UI.
    - Set your desired defaults for chunked rendering and auto-fallback.

3. **Preflight Check:**
   Verify that required tools are installed and CUDA is available.
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\windows\preflight.ps1
   ```

4. **Install Dependencies:**
   Install pnpm packages and Python requirements inside a virtual environment.
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\windows\install.ps1
   ```

5. **Run the Development Environment:**
   Start the API with hot reload and the UI development server.
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\windows\run-dev.ps1
   ```

6. **Run in Production Mode:**
   Build the UI and launch the API with two workers serving the static build.
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\windows\run-prod.ps1
   ```

7. **Stop All Services:**
   To stop running processes, use:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\windows\stop-all.ps1
   ```

## Smoke Tests

Once everything is running, verify the installation:

0. **TypeScript type checks**: `pnpm typecheck` → should report no issues.
1.  **Core API Health**: `GET http://127.0.0.1:8000/healthz` → `{"ok":true}`.
2.  **VRAM Probe**: `GET http://127.0.0.1:8000/api/system/vram` → Returns JSON with GPU info.
3.  **ACE-Step API**: `POST http://127.0.0.1:8001/api/ace/generate` with JSON body `{ "prompt": "test", "style": "lofi" }` → `{"url":"/static/ace/output.wav"}`.

4.  **UI Validation** (open `http://localhost:5173`):
    - **Settings Tab**: Click "VRAM Probe". The results should appear.
    - **Music tab**: Enter prompt "dark cinematic hip-hop" → returns a playable WAV file.
    - **Music tab (Chunked)**: Enable "Advanced" -> "Use chunked rendering" and generate. It should produce a longer track.
    - **LLM Connector Tab**: Select "Gemini", choose "Songwriting" task, enter a prompt → returns text.
    - **Publisher Tab**: Select a platform, generate captions, and schedule a post. The job should appear on the Schedule Board.
    - Check the browser's developer console for any CORS or 404 errors.
