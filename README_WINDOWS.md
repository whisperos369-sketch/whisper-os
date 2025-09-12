
# Whisper OS v13 (Windows Native)

This project is a fully-featured, AI-powered music creation studio designed to run natively on Windows with NVIDIA GPU acceleration. It allows users to generate lyrics, music, cover art, and promotional videos through a web-based interface, backed by a Python API server.

## Features

- **Windows Native**: No Docker or WSL required. Runs directly on Windows for maximum performance.
- **PowerShell Driven**: Includes scripts for easy installation, preflight checks, development/production runs, and smoke testing.
- **GPU Accelerated**: Leverages native Windows CUDA builds for PyTorch and ONNXRuntime.
- **AI-Powered Generation**:
  - Lyrics: Ollama (Windows)
  - Music: MusicGen
  - Cover Art: Stable Diffusion 1.5 (ONNX)
  - Video: FFmpeg
- **"Hands-Off" Mode**: An autonomous workflow to generate a complete song package, which can be scheduled to run daily via Windows Task Scheduler.
- **Modular UI**: A responsive Lit-based frontend with a full suite of creation tools.

## Prerequisites

1.  **NVIDIA GPU**: A CUDA-compatible NVIDIA GPU with at least 8 GB of VRAM is recommended.
2.  **NVIDIA Driver**: The latest NVIDIA Game Ready or Studio driver.
3.  **CUDA Toolkit**: While the PyTorch wheels include CUDA runtime libraries, having the full CUDA Toolkit 12.1 installed can help with driver compatibility and diagnostics.
4.  **Python**: Python 3.10 or 3.11 (64-bit). Ensure it's added to your PATH during installation.
5.  **Node.js**: Node.js 20.x or later.
6.  **Git**: For cloning the repository.
7.  **FFmpeg**: A static build of FFmpeg is required for video generation. The installation script will attempt to guide you.
8.  **Ollama (for Lyrics)**:
    - Download and run the [Ollama for Windows installer](https://ollama.com/download).
    - After installation, open PowerShell and run: `ollama pull llama3:8b`

## Setup & Installation

1.  **Clone the repository:**
    ```powershell
    git clone <repository_url>
    cd whisper-os-v13
    ```

2.  **Run the Installer:**
    Open PowerShell **as Administrator** and run the installation script. This will create a Python virtual environment, install all dependencies, and help you set up FFmpeg.

    ```powershell
    # Make sure you are in the project's root directory
    cd windows
    .\install.ps1
    ```
    > **Note on FFmpeg**: The script will download an archive. You may need to manually extract `ffmpeg.exe` and `ffprobe.exe` into the `whisper-os-v13/windows/ffmpeg/` directory if you don't have a `.7z` extractor installed (like 7-Zip).

3.  **Run Pre-flight Checks:**
    After installation, run the preflight script to ensure your environment is configured correctly.

    ```powershell
    .\preflight.ps1
    ```
    This script will verify your GPU, check that PyTorch can access CUDA, confirm ONNXRuntime sees the GPU, and detect FFmpeg.

## Running the Application

### Development Mode
For development with backend hot-reloading:

```powershell
# From the /windows directory
.\run-dev.ps1
```
This will build the UI once and start the backend server. The UI is accessible at `http://127.0.0.1:8000`. If you make changes to the UI, you will need to stop the server (Ctrl+C) and run the script again.

### Production Mode
For a production-ready server accessible on your local network:

```powershell
# From the /windows directory
.\run-prod.ps1
```
The application will be served at `http://0.0.0.0:8000`.

## Autonomous "Hands-Off" Mode

You can schedule a daily task to run the "Hands-Off" pipeline, which will generate a full song package.

Open PowerShell **as Administrator** and run:
```powershell
# From the /windows directory
.\schedule-handoff.ps1
```
This creates a Windows Scheduled Task named "WhisperOS-HandsOff" that runs daily at 9:00 AM.

## Troubleshooting

- **Torch CUDA Mismatch**: Ensure your NVIDIA driver is up to date. The installed PyTorch version requires a driver compatible with CUDA 12.1.
- **ONNX Providers**: The preflight check should list `CUDAExecutionProvider` or `DmlExecutionProvider`. If not, your ONNXRuntime-GPU installation may be incorrect or incompatible with your driver.
- **Long Paths**: If you encounter errors related to file paths being too long, enable long path support in Windows. You can do this by running the following in an Administrator PowerShell:
  ```powershell
  Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -Force
  ```
