from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "EduForge"
    app_display_name: str = "EduForge 智学工坊"
    app_env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    competition_name: str = "第十五届中国软件杯"
    competition_track: str = "A3"
    competition_topic: str = "基于大模型的个性化资源生成与学习多智能体系统开发"
    frontend_origin: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
