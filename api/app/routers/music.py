from fastapi import APIRouter
from uuid import uuid4
from pathlib import Path
from ..schemas import MusicGenerateRequest, MusicGenerateResponse
from ..config import settings

router = APIRouter()

ART_DIR = Path(settings.artifacts_dir) / "music"
ART_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/generate", response_model=MusicGenerateResponse)
def generate_music(req: MusicGenerateRequest) -> MusicGenerateResponse:
    uid = uuid4().hex
    wav_path = ART_DIR / f"{uid}.wav"
    mp3_path = ART_DIR / f"{uid}.mp3"
    wav_path.write_bytes(b"fake wav")
    mp3_path.write_bytes(b"fake mp3")
    report = {"status": "ok", "prompt": req.prompt, "model": req.model}
    return MusicGenerateResponse(wavPath=str(wav_path), mp3Path=str(mp3_path), report=report)
