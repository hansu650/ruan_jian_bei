import json
from hashlib import sha256
from pathlib import Path

from fastapi import UploadFile
from sqlmodel import Session, col, delete, select

from app.db.models import CourseDocument, DocumentChunk
from app.schemas.documents import DocumentImportResult
from app.services.chunking import chunk_text
from app.services.document_parser import SUPPORTED_SUFFIXES, parse_document

MAX_UPLOAD_BYTES = 2 * 1024 * 1024

PROJECT_ROOT = Path(__file__).resolve().parents[4]
API_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_COURSE_DIR = PROJECT_ROOT / "data" / "sample_courses" / "database_system"
UPLOAD_DIR = API_ROOT / "storage" / "uploads"


def _file_hash(path: Path) -> str:
    return sha256(path.read_bytes()).hexdigest()


def _bytes_hash(data: bytes) -> str:
    return sha256(data).hexdigest()


def _safe_filename(filename: str | None) -> str:
    name = Path(filename or "uploaded.txt").name.strip()
    return name or "uploaded.txt"


def _existing_document(
    course_id: int,
    original_filename: str,
    content_hash: str,
    session: Session,
) -> CourseDocument | None:
    statement = select(CourseDocument).where(
        CourseDocument.course_id == course_id,
        CourseDocument.original_filename == original_filename,
        CourseDocument.content_hash == content_hash,
    )
    return session.exec(statement).first()


def index_document(document: CourseDocument, session: Session) -> int:
    if document.id is None:
        raise ValueError("文档必须先保存后才能建立 chunk。")

    if document.storage_path is None:
        document.status = "failed"
        document.error_message = "文档缺少存储路径。"
        session.add(document)
        session.commit()
        return 0

    path = Path(document.storage_path)
    created_chunks = 0
    try:
        text, file_type = parse_document(path)
        session.exec(delete(DocumentChunk).where(col(DocumentChunk.document_id) == document.id))
        drafts = chunk_text(text)
        for chunk_index, draft in enumerate(drafts):
            metadata = {
                **draft.metadata,
                "filename": document.filename,
                "original_filename": document.original_filename,
                "source_type": document.source_type,
            }
            chunk = DocumentChunk(
                document_id=document.id or 0,
                course_id=document.course_id,
                chunk_index=chunk_index,
                section_title=draft.section_title,
                content=draft.content,
                char_count=draft.char_count,
                content_hash=draft.content_hash,
                metadata_json=json.dumps(metadata, ensure_ascii=False),
            )
            session.add(chunk)
            created_chunks += 1

        document.file_type = file_type
        document.status = "indexed"
        document.chunk_count = created_chunks
        document.error_message = None
    except Exception as exc:
        document.status = "failed"
        document.chunk_count = 0
        document.error_message = str(exc)

    session.add(document)
    session.commit()
    session.refresh(document)
    return created_chunks


def import_sample_documents(course_id: int, session: Session) -> DocumentImportResult:
    imported_documents = 0
    indexed_documents = 0
    created_chunks = 0
    skipped_documents = 0

    for path in sorted(SAMPLE_COURSE_DIR.glob("*.md")):
        content_hash = _file_hash(path)
        existing = _existing_document(course_id, path.name, content_hash, session)
        if existing is not None:
            skipped_documents += 1
            continue

        document = CourseDocument(
            course_id=course_id,
            filename=path.name,
            original_filename=path.name,
            file_type="md",
            source_type="sample",
            storage_path=str(path),
            content_hash=content_hash,
        )
        session.add(document)
        session.commit()
        session.refresh(document)

        imported_documents += 1
        chunk_count = index_document(document, session)
        created_chunks += chunk_count
        if document.status == "indexed":
            indexed_documents += 1

    return DocumentImportResult(
        imported_documents=imported_documents,
        indexed_documents=indexed_documents,
        created_chunks=created_chunks,
        skipped_documents=skipped_documents,
        message=(
            f"已导入 {imported_documents} 个示例文档，"
            f"新增 {created_chunks} 个 chunk，跳过 {skipped_documents} 个重复文档。"
        ),
    )


def save_uploaded_document(
    course_id: int,
    upload_file: UploadFile,
    session: Session,
) -> CourseDocument:
    original_filename = _safe_filename(upload_file.filename)
    suffix = Path(original_filename).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError("当前阶段仅支持上传 .md 和 .txt 文件。")

    upload_file.file.seek(0)
    data = upload_file.file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise ValueError("上传文件不能超过 2MB。")

    content_hash = _bytes_hash(data)
    existing = _existing_document(course_id, original_filename, content_hash, session)
    if existing is not None:
        return existing

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{course_id}_{content_hash[:12]}_{original_filename}"
    storage_path = UPLOAD_DIR / stored_filename
    storage_path.write_bytes(data)

    document = CourseDocument(
        course_id=course_id,
        filename=stored_filename,
        original_filename=original_filename,
        file_type=SUPPORTED_SUFFIXES[suffix],
        source_type="upload",
        storage_path=str(storage_path),
        content_hash=content_hash,
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    index_document(document, session)
    return document
