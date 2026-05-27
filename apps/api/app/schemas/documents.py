from datetime import datetime

from pydantic import BaseModel


class CourseDocumentRead(BaseModel):
    id: int
    course_id: int
    filename: str
    original_filename: str
    file_type: str
    source_type: str
    status: str
    chunk_count: int
    error_message: str | None
    content_hash: str | None
    created_at: datetime
    updated_at: datetime


class DocumentChunkRead(BaseModel):
    id: int
    document_id: int
    course_id: int
    chunk_index: int
    section_title: str | None
    content: str
    char_count: int
    content_hash: str
    metadata_json: str
    created_at: datetime


class DocumentImportResult(BaseModel):
    imported_documents: int
    indexed_documents: int
    created_chunks: int
    skipped_documents: int
    message: str


class DocumentSearchResult(BaseModel):
    document_id: int
    filename: str
    chunk_id: int
    chunk_index: int
    section_title: str | None
    content: str
    score: int
    metadata_json: str


class KnowledgeBaseStats(BaseModel):
    course_id: int
    document_count: int
    chunk_count: int
    indexed_document_count: int
