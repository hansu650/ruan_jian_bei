from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.qa import QAChecklistResponse, QASmokeStatusResponse
from app.services.qa_service import get_qa_checklist, get_qa_smoke_status

router = APIRouter(prefix="/api/qa", tags=["qa"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/checklist", response_model=QAChecklistResponse)
def read_qa_checklist() -> QAChecklistResponse:
    return get_qa_checklist()


@router.get("/smoke-status", response_model=QASmokeStatusResponse)
def read_qa_smoke_status(session: SessionDep) -> QASmokeStatusResponse:
    return get_qa_smoke_status(session)
