from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])
SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.get("/health", response_model=HealthResponse)
def health_check(settings: SettingsDep) -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="eduforge-api",
        project=settings.app_display_name,
        competition=f"中国软件杯 {settings.competition_track}",
        stage="phase-6",
    )
