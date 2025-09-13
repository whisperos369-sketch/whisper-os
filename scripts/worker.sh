#!/bin/bash
cd "$(dirname "$0")/.."
python -m celery -A api.app.celery_app:celery_app worker --loglevel=INFO
