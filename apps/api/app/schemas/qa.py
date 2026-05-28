from pydantic import BaseModel


class QACheckItem(BaseModel):
    id: str
    module: str
    title: str
    description: str
    route: str
    expected_result: str
    priority: str
    requires_llm: bool
    may_call_spark: bool
    status_hint: str


class QAChecklistResponse(BaseModel):
    title: str
    description: str
    items: list[QACheckItem]


class QASmokeItem(BaseModel):
    key: str
    title: str
    status: str
    message: str
    count: int | None = None


class QASmokeStatusResponse(BaseModel):
    status: str
    items: list[QASmokeItem]
    warning: str | None = None
