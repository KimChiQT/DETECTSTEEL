"""
Configuration settings for DetectSteel backend
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

# Resolve best.pt: check backend dir first, then project root
_backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_root_dir = os.path.dirname(_backend_dir)
_default_model = (
    os.path.join(_backend_dir, "best.pt") if os.path.exists(os.path.join(_backend_dir, "best.pt"))
    else os.path.join(_root_dir, "best.pt")
)

class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "DetectSteel API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False") == "True"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./detectsteel.db"
    )
    SQLALCHEMY_ECHO: bool = DEBUG
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]
    
    # Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", _default_model)
    CONFIDENCE_THRESHOLD: float = 0.5
    
    # API
    API_PREFIX: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
