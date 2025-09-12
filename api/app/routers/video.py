from fastapi import APIRouter
from uuid import uuid4
from pathlib import Path
from ..schemas import VideoRenderRequest, VideoRenderResponse
from ..config import settings

router = APIRouter()

ART_DIR = Path(settings.artifacts_dir) / "video"
ART_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/render", response_model=VideoRenderResponse)
def render_video(req: VideoRenderRequest) -> VideoRenderResponse:
    uid = uuid4().hex
    vid_path = ART_DIR / f"{uid}.mp4"
    vid_path.write_bytes(b"")
    return VideoRenderResponse(videoPath=str(vid_path))
