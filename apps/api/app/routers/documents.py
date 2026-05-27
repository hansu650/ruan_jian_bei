from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlmodel import Session, col, select

from app.db.database import get_session
from app.db.models import Course, CourseDocument, DocumentChunk
from app.schemas.documents import (
    CourseDocumentRead,
    DocumentChunkRead,
    DocumentImportResult,
    DocumentSearchResult,
    KnowledgeBaseStats,
)
from app.services.document_indexer import import_sample_documents, save_uploaded_document
from app.services.search_service import search_chunks

router = APIRouter(prefix="/api/courses/{course_id}", tags=["documents"])
SessionDep = Annotated[Session, Depends(get_session)]
UploadDep = Annotated[UploadFile, File()]


def ensure_course(course_id: int, session: Session) -> Course:
    course = session.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


def ensure_document(course_id: int, document_id: int, session: Session) -> CourseDocument:
    document = session.get(CourseDocument, document_id)
    if document is None or document.course_id != course_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document


@router.get("/documents", response_model=list[CourseDocumentRead])
def list_documents(course_id: int, session: SessionDep) -> list[CourseDocument]:
    ensure_course(course_id, session)
    statement = (
        select(CourseDocument)
        .where(CourseDocument.course_id == course_id)
        .order_by(col(CourseDocument.id))
    )
    return list(session.exec(statement).all())


@router.post("/documents/import-sample", response_model=DocumentImportResult)
def import_sample(course_id: int, session: SessionDep) -> DocumentImportResult:
    ensure_course(course_id, session)
    return import_sample_documents(course_id, session)


@router.post(
    "/documents/upload",
    response_model=CourseDocumentRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    course_id: int,
    session: SessionDep,
    file: UploadDep,
) -> CourseDocument:
    ensure_course(course_id, session)
    try:
        return save_uploaded_document(course_id, file, session)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/documents/{document_id}/chunks", response_model=list[DocumentChunkRead])
def list_document_chunks(
    course_id: int,
    document_id: int,
    session: SessionDep,
) -> list[DocumentChunk]:
    ensure_course(course_id, session)
    ensure_document(course_id, document_id, session)
    statement = (
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document_id)
        .order_by(col(DocumentChunk.chunk_index))
    )
    return list(session.exec(statement).all())


@router.get("/knowledge-base/stats", response_model=KnowledgeBaseStats)
def get_knowledge_base_stats(course_id: int, session: SessionDep) -> KnowledgeBaseStats:
    ensure_course(course_id, session)
    documents = list(
        session.exec(select(CourseDocument).where(CourseDocument.course_id == course_id)).all()
    )
    chunks = list(
        session.exec(select(DocumentChunk).where(DocumentChunk.course_id == course_id)).all()
    )
    indexed_document_count = sum(1 for document in documents if document.status == "indexed")
    return KnowledgeBaseStats(
        course_id=course_id,
        document_count=len(documents),
        chunk_count=len(chunks),
        indexed_document_count=indexed_document_count,
    )


@router.get("/knowledge-base/search", response_model=list[DocumentSearchResult])
def search_knowledge_base(
    course_id: int,
    session: SessionDep,
    q: str = "",
    limit: int = 10,
) -> list[DocumentSearchResult]:
    ensure_course(course_id, session)
    safe_limit = max(1, min(limit, 50))
    return search_chunks(course_id=course_id, query=q, session=session, limit=safe_limit)
