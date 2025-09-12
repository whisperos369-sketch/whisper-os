from fastapi import FastAPI
from .routers import lyrics, music, cover, video, system

app = FastAPI()

app.include_router(lyrics.router, prefix="/api/lyrics")
app.include_router(music.router, prefix="/api/music")
app.include_router(cover.router, prefix="/api/cover")
app.include_router(video.router, prefix="/api/video")
app.include_router(system.router, prefix="/api/system")


@app.get("/")
def root():
    return {"message": "Whisper OS API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.app.main:app", host="0.0.0.0", port=8080, reload=True)
