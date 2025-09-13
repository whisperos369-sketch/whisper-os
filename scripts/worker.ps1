cd $PSScriptRoot\..
python -m celery -A api.app.celery_app:celery_app worker --loglevel=INFO
