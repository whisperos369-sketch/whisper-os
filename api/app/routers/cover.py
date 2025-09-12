from fastapi import APIRouter
from uuid import uuid4
from pathlib import Path
from ..schemas import CoverGenerateRequest, CoverGenerateResponse
from ..config import settings

router = APIRouter()

ART_DIR = Path(settings.artifacts_dir) / "cover"
ART_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/generate", response_model=CoverGenerateResponse)
def generate_cover(req: CoverGenerateRequest) -> CoverGenerateResponse:
    uid = uuid4().hex
    img_path = ART_DIR / f"{uid}.png"
    img_path.write_bytes(b"")
    return CoverGenerateResponse(imagePath=str(img_path))
