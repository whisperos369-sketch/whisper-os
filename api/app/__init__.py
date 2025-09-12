from fastapi import FastAPI

from .routers.music import router as music_router

app = FastAPI()
app.include_router(music_router)
