import re

from sqlmodel import Session, col, select

from app.db.models import CourseDocument, DocumentChunk
from app.schemas.documents import DocumentSearchResult


def _query_terms(query: str) -> list[str]:
    tokens = re.findall(r"[A-Za-z0-9+]+|[\u4e00-\u9fff]+", query)
    terms = [token.strip() for token in tokens if token.strip()]
    compact = query.strip()
    if compact and compact not in terms:
        terms.insert(0, compact)
    return terms


def _score_chunk(query: str, terms: list[str], chunk: DocumentChunk) -> int:
    content_upper = chunk.content.upper()
    title_upper = (chunk.section_title or "").upper()
    query_upper = query.upper()

    score = content_upper.count(query_upper) * 10
    for term in terms:
        term_upper = term.upper()
        score += content_upper.count(term_upper)
        if term_upper and term_upper in title_upper:
            score += 5
    return score


def search_chunks(
    course_id: int,
    query: str,
    session: Session,
    limit: int = 10,
) -> list[DocumentSearchResult]:
    normalized_query = query.strip()
    if not normalized_query:
        return []

    terms = _query_terms(normalized_query)
    statement = (
        select(DocumentChunk, CourseDocument)
        .join(CourseDocument, col(CourseDocument.id) == col(DocumentChunk.document_id))
        .where(DocumentChunk.course_id == course_id)
    )
    scored: list[tuple[int, DocumentChunk, CourseDocument]] = []
    for chunk, document in session.exec(statement).all():
        score = _score_chunk(normalized_query, terms, chunk)
        if score > 0:
            scored.append((score, chunk, document))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        DocumentSearchResult(
            document_id=document.id or 0,
            filename=document.original_filename,
            chunk_id=chunk.id or 0,
            chunk_index=chunk.chunk_index,
            section_title=chunk.section_title,
            content=chunk.content,
            score=score,
            metadata_json=chunk.metadata_json,
        )
        for score, chunk, document in scored[:limit]
    ]
