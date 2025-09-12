import json
import math
import os
import struct
import subprocess
import wave
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, Optional

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/music", tags=["music"])


class GenerateRequest(BaseModel):
    prompt: str
    durationSec: int
    model: Literal["musicgen-small", "musicgen-medium"]
    seed: Optional[int] = None


@router.post("/generate")
async def generate_music(req: GenerateRequest):
    enabled = os.getenv("MUSICGEN_ENABLED", "false").lower() == "true"
    model_name = os.getenv("MUSICGEN_MODEL", req.model)
    artifacts_root = Path(os.getenv("ARTIFACTS_DIR", "artifacts"))
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    out_dir = artifacts_root / "music" / timestamp
    out_dir.mkdir(parents=True, exist_ok=True)

    seed = req.seed if req.seed is not None else 0
    raw_wav = out_dir / "raw.wav"
    mp3_file = out_dir / "master.mp3"
    report_file = out_dir / "report.json"

    if enabled:
        try:
            from audiocraft.models import MusicGen
            import soundfile as sf
            import torch

            model = MusicGen.get_pretrained(model_name)
            if req.seed is not None:
                torch.manual_seed(req.seed)
            waveform = model.generate(
                [req.prompt], progress=False, duration=req.durationSec
            )[0]
            sf.write(raw_wav, waveform.cpu().T, model.sample_rate)
        except Exception:
            enabled = False

    if not enabled:
        sr = 32000
        duration = 3  # seconds
        freq = 440.0
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        samples = 0.2 * np.sin(2 * math.pi * freq * t)
        with wave.open(str(raw_wav), "w") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            for s in samples:
                wf.writeframes(struct.pack("<h", int(s * 32767)))

    subprocess.run(
        ["ffmpeg", "-y", "-i", str(raw_wav), "-b:a", "320k", str(mp3_file)],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    report = {
        "prompt": req.prompt,
        "seed": seed,
        "model": model_name,
        "durationSec": req.durationSec if enabled else 3,
        "timestamp": timestamp,
    }
    report_file.write_text(json.dumps(report))

    return {
        "raw": str(raw_wav),
        "mp3": str(mp3_file),
        "report": str(report_file),
        "model_used": model_name if enabled else "stub",
    }
