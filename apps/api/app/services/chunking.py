import re
from dataclasses import dataclass
from hashlib import sha256


@dataclass(frozen=True)
class ChunkDraft:
    section_title: str | None
    content: str
    char_count: int
    content_hash: str
    metadata: dict[str, str | int | None]


def _hash_content(content: str) -> str:
    return sha256(content.strip().encode("utf-8")).hexdigest()


def _split_sections(text: str) -> list[tuple[str | None, str]]:
    sections: list[tuple[str | None, list[str]]] = []
    current_title: str | None = None
    current_lines: list[str] = []

    for line in text.replace("\r\n", "\n").split("\n"):
        stripped = line.strip()
        if stripped.startswith("#"):
            if current_lines:
                sections.append((current_title, current_lines))
            current_title = stripped.lstrip("#").strip() or None
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_title, current_lines))

    if not sections:
        return [(None, text)]

    return [(title, "\n".join(lines).strip()) for title, lines in sections]


def _split_long_content(content: str, max_chars: int, overlap: int) -> list[str]:
    paragraphs = [item.strip() for item in re.split(r"\n\s*\n", content) if item.strip()]
    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        if len(paragraph) > max_chars:
            if current:
                chunks.append(current.strip())
                current = ""
            start = 0
            step = max(1, max_chars - overlap)
            while start < len(paragraph):
                piece = paragraph[start : start + max_chars].strip()
                if piece:
                    chunks.append(piece)
                start += step
            continue

        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current.strip())
            current = paragraph

    if current:
        chunks.append(current.strip())

    return chunks


def chunk_text(
    text: str,
    *,
    max_chars: int = 800,
    overlap: int = 80,
) -> list[ChunkDraft]:
    chunks: list[ChunkDraft] = []
    for section_title, section_content in _split_sections(text):
        if not section_content.strip():
            continue
        pieces = _split_long_content(section_content, max_chars=max_chars, overlap=overlap)
        for piece_index, piece in enumerate(pieces):
            content = piece.strip()
            if not content:
                continue
            chunks.append(
                ChunkDraft(
                    section_title=section_title,
                    content=content,
                    char_count=len(content),
                    content_hash=_hash_content(content),
                    metadata={
                        "section_title": section_title,
                        "section_piece_index": piece_index,
                    },
                )
            )
    return chunks
