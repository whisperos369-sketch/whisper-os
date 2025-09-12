import os
from pydantic import BaseModel


class Settings(BaseModel):
    artifacts_dir: str = "artifacts"
    default_margin_percent: float = float(os.getenv("DEFAULT_MARGIN_PERCENT", 20))


settings = Settings()
