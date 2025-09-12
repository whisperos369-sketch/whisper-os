from fastapi import APIRouter

router = APIRouter()

@router.get("/music/ping")
async def ping() -> dict[str, str]:
    """Lightweight endpoint used for health checks in tests."""
    return {"status": "ok"}
