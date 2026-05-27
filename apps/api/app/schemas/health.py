from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    project: str
    competition: str
    stage: str
