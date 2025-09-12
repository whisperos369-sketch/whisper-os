from fastapi import APIRouter
from ..schemas import LyricsDraftRequest, LyricsDraftResponse, LyricDraft
from ..validators import validate_prompt

router = APIRouter()

@router.post("/draft", response_model=LyricsDraftResponse)
def draft_lyrics(req: LyricsDraftRequest) -> LyricsDraftResponse:
    prompt = validate_prompt(req.prompt)
    style = req.style or ""
    base = f"{prompt.strip()} [{style.strip()}]".strip()
    drafts = [
        LyricDraft(text=f"{base} - line 1"),
        LyricDraft(text=f"{base} - line 2"),
    ]
    return LyricsDraftResponse(drafts=drafts)
