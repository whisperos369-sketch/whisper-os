import os
import sys
import pathlib
os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "1")
sys.path.append(str(pathlib.Path(__file__).resolve().parents[2]))
from api.app.tasks import generate_music_task, render_video_task
from api.app.config import settings


def test_generate_music_task(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "artifacts_dir", str(tmp_path))
    res = generate_music_task.delay("beat", 5, "model").get()
    wav = pathlib.Path(res["wavPath"])
    mp3 = pathlib.Path(res["mp3Path"])
    assert wav.exists()
    assert mp3.exists()


def test_render_video_task(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "artifacts_dir", str(tmp_path))
    res = render_video_task.delay("a.wav", "preset").get()
    vid = pathlib.Path(res["videoPath"])
    assert vid.exists()
