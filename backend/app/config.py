import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load env variables from the root .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

class Settings(BaseSettings):
    GEMINI_API_KEY: str = "mock-api-key"
    GEMINI_MODEL: str = "gemini-3.5-flash"
    MONGODB_URI: str = "mongodb://localhost:27017/interviewai_x"
    JWT_SECRET: str = "secret-key-1"
    JWT_REFRESH_SECRET: str = "secret-key-2"
    UPLOAD_FOLDER: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB
    
    # JWT expiration times
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        case_sensitive = True

settings = Settings()
