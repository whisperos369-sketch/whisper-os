from pathlib import Path
from uuid import uuid4
from .celery_app import celery_app
from .config import settings

@celery_app.task(name="music.generate")
def generate_music_task(prompt: str, duration_sec: int, model: str):
    art_dir = Path(settings.artifacts_dir) / "music"
    art_dir.mkdir(parents=True, exist_ok=True)
    uid = uuid4().hex
    wav_path = art_dir / f"{uid}.wav"
    mp3_path = art_dir / f"{uid}.mp3"
    wav_path.write_bytes(b"fake wav")
    mp3_path.write_bytes(b"fake mp3")
    report = {"status": "ok", "prompt": prompt, "model": model}
    return {"wavPath": str(wav_path), "mp3Path": str(mp3_path), "report": report}

@celery_app.task(name="video.render")
def render_video_task(audio_path: str, preset: str):
    art_dir = Path(settings.artifacts_dir) / "video"
    art_dir.mkdir(parents=True, exist_ok=True)
    uid = uuid4().hex
    vid_path = art_dir / f"{uid}.mp4"
    vid_path.write_bytes(b"")
    return {"videoPath": str(vid_path)}
