from typing import List, Dict, Any
from pydantic import BaseModel

class LyricDraft(BaseModel):
    text: str

class LyricsDraftRequest(BaseModel):
    prompt: str
    style: str | None = None

class LyricsDraftResponse(BaseModel):
    drafts: List[LyricDraft]

class MusicGenerateRequest(BaseModel):
    prompt: str
    durationSec: int
    model: str

class MusicGenerateResponse(BaseModel):
    wavPath: str
    mp3Path: str
    report: Dict[str, Any]

class CoverGenerateRequest(BaseModel):
    prompt: str

class CoverGenerateResponse(BaseModel):
    imagePath: str

class VideoRenderRequest(BaseModel):
    audioPath: str
    preset: str

class VideoRenderResponse(BaseModel):
    videoPath: str

class GPUInfo(BaseModel):
    name: str
    vramGB: float

class HealthResponse(BaseModel):
    ok: bool
    gpu: GPUInfo
