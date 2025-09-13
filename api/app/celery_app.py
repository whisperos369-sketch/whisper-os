import os
from celery import Celery

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "whisper_os",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.task_always_eager = os.getenv("CELERY_TASK_ALWAYS_EAGER") == "1"
