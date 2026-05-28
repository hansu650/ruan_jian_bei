from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.demo import DemoBootstrapResponse, DemoStatusResponse
from app.services.demo_service import bootstrap_demo_data, get_demo_status

router = APIRouter(prefix="/api/demo", tags=["demo"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/status", response_model=DemoStatusResponse)
def read_demo_status(session: SessionDep) -> DemoStatusResponse:
    return get_demo_status(session)


@router.post("/bootstrap", response_model=DemoBootstrapResponse)
def bootstrap_demo(session: SessionDep) -> DemoBootstrapResponse:
    return bootstrap_demo_data(session)
