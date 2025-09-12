from pydantic import BaseModel

class Settings(BaseModel):
    artifacts_dir: str = "artifacts"

settings = Settings()
