from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.db.database import get_session
from app.schemas.generated_resources import (
    GeneratedResourceRead,
    GenerateResourceRequest,
    GenerateResourceResponse,
    GenerateStepResourcesRequest,
    GenerateStepResourcesResponse,
    ResourceTypeInfo,
)
from app.services.generated_resource_service import (
    generate_resource,
    generate_step_resources,
    get_generated_resource,
    list_generated_resources,
    list_resource_types,
)

router = APIRouter(prefix="/api/generated-resources", tags=["generated-resources"])
SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/types", response_model=list[ResourceTypeInfo])
def resource_types() -> list[ResourceTypeInfo]:
    return list_resource_types()


@router.post("/generate", response_model=GenerateResourceResponse)
def generate_single_resource(
    request: GenerateResourceRequest,
    session: SessionDep,
) -> GenerateResourceResponse:
    return generate_resource(request, session)


@router.post("/generate-for-step", response_model=GenerateStepResourcesResponse)
def generate_resources_for_step(
    request: GenerateStepResourcesRequest,
    session: SessionDep,
) -> GenerateStepResourcesResponse:
    return generate_step_resources(request, session)


@router.get("", response_model=list[GeneratedResourceRead])
def generated_resources(
    session: SessionDep,
    student_id: int | None = Query(default=None),
    course_id: int | None = Query(default=None),
    path_id: int | None = Query(default=None),
    step_id: int | None = Query(default=None),
    resource_type: str | None = Query(default=None),
) -> list[GeneratedResourceRead]:
    return list_generated_resources(
        session,
        student_id=student_id,
        course_id=course_id,
        path_id=path_id,
        step_id=step_id,
        resource_type=resource_type,
    )


@router.get("/{resource_id}", response_model=GeneratedResourceRead)
def generated_resource_detail(resource_id: int, session: SessionDep) -> GeneratedResourceRead:
    return get_generated_resource(resource_id, session)
