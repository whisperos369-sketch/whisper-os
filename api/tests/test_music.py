import json
import os
from pathlib import Path
import sys

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))
from api.app import app


def test_stub_mode_generates_wav(tmp_path, monkeypatch):
    monkeypatch.setenv("MUSICGEN_ENABLED", "false")
    monkeypatch.setenv("ARTIFACTS_DIR", str(tmp_path))

    client = TestClient(app)
    payload = {
        "prompt": "test prompt",
        "durationSec": 5,
        "model": "musicgen-small",
        "seed": 123,
    }
    res = client.post("/api/music/generate", json=payload)
    assert res.status_code == 200
    data = res.json()
    raw = Path(data["raw"])
    mp3 = Path(data["mp3"])
    report = Path(data["report"])

    for p in (raw, mp3, report):
        assert p.exists(), f"missing {p}"
    assert raw.stat().st_size > 1024
    assert mp3.stat().st_size > 1024

    with raw.open("rb") as f:
        header = f.read(12)
    assert header[:4] == b"RIFF"
    assert header[8:12] == b"WAVE"

    rep = json.loads(report.read_text())
    assert rep["prompt"] == payload["prompt"]
    assert rep["seed"] == payload["seed"]
