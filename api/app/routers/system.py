from fastapi import APIRouter
from ..schemas import HealthResponse, GPUInfo

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    name = "CPU"
    vram = 0.0
    try:
        import torch
        if torch.cuda.is_available():
            name = torch.cuda.get_device_name(0)
            vram = round(torch.cuda.get_device_properties(0).total_memory / 1e9, 2)
    except Exception:
        pass
    return HealthResponse(ok=True, gpu=GPUInfo(name=name, vramGB=vram))
