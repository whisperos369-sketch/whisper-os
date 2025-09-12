# Quickstart

## GPU vs CPU
- **GPU**: Set `MUSICGEN_ENABLED=true` in `.env` and install [audiocraft](https://github.com/facebookresearch/audiocraft). Generation uses the selected `MUSICGEN_MODEL`.
- **CPU / Stub**: Leave `MUSICGEN_ENABLED=false` to use the built-in 3‑second sine wave generator. This mode is deterministic and requires no heavy dependencies.

## Toggling MusicGen
1. Copy `.env.example` to `.env` and adjust variables.
2. Set `MUSICGEN_ENABLED=true` to run the real model or `false` for the stub.
3. Generated files are saved to `ARTIFACTS_DIR` (default `./artifacts`).

Run unit tests with:
```bash
pytest
```
