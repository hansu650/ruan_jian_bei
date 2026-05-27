from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.agent_runs import AgentRunRead
from app.services.profile_service import list_agent_runs

router = APIRouter(prefix="/api/agent-runs", tags=["agent-runs"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[AgentRunRead])
def agent_runs(
    session: SessionDep,
    agent_name: str | None = None,
    student_id: int | None = None,
    course_id: int | None = None,
    limit: int = 50,
) -> list[AgentRunRead]:
    return list_agent_runs(
        session,
        agent_name=agent_name,
        student_id=student_id,
        course_id=course_id,
        limit=limit,
    )
