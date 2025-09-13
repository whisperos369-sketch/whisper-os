from fastapi import APIRouter
from ..schemas import MusicGenerateRequest, MusicGenerateResponse
from ..tasks import generate_music_task

router = APIRouter()

@router.post("/generate", response_model=MusicGenerateResponse)
def generate_music(req: MusicGenerateRequest) -> MusicGenerateResponse:
    res = generate_music_task.delay(req.prompt, req.durationSec, req.model).get()
    return MusicGenerateResponse(**res)
