from pydantic import BaseModel


class MetaResponse(BaseModel):
    app_name: str
    display_name: str
    competition_name: str
    competition_track: str
    competition_topic: str
    project_positioning: str
    core_loop: list[str]
    implemented_features: list[str]
    planned_features: list[str]
