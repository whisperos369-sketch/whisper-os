from fastapi.testclient import TestClient
import os
import sys
import pathlib
os.environ.setdefault("CELERY_TASK_ALWAYS_EAGER", "1")
sys.path.append(str(pathlib.Path(__file__).resolve().parents[2]))
from api.app.main import app

client = TestClient(app)

def test_health():
    r = client.get('/api/system/health')
    assert r.status_code == 200
    data = r.json()
    assert data['ok'] is True
    assert 'name' in data['gpu']

def test_lyrics_draft():
    r = client.post('/api/lyrics/draft', json={'prompt': 'hello', 'style': 'pop'})
    assert r.status_code == 200
    data = r.json()
    assert len(data['drafts']) == 2
    assert data['drafts'][0]['text'].startswith('hello')

def test_music_generate():
    r = client.post('/api/music/generate', json={'prompt':'beat','durationSec':5,'model':'test'})
    assert r.status_code == 200
    data = r.json()
    assert os.path.exists(data['wavPath'])
    assert os.path.exists(data['mp3Path'])

def test_cover_generate():
    r = client.post('/api/cover/generate', json={'prompt':'art'})
    assert r.status_code == 200
    data = r.json()
    assert os.path.exists(data['imagePath'])

def test_video_render():
    r = client.post('/api/video/render', json={'audioPath':'a.wav','preset':'spectrum'})
    assert r.status_code == 200
    data = r.json()
    assert os.path.exists(data['videoPath'])
