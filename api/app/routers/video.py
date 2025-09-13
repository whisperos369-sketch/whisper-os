from fastapi import APIRouter
from ..schemas import VideoRenderRequest, VideoRenderResponse
from ..tasks import render_video_task

router = APIRouter()

@router.post("/render", response_model=VideoRenderResponse)
def render_video(req: VideoRenderRequest) -> VideoRenderResponse:
    res = render_video_task.delay(req.audioPath, req.preset).get()
    return VideoRenderResponse(**res)
