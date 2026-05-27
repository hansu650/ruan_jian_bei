from pathlib import Path

SUPPORTED_SUFFIXES = {".md": "md", ".txt": "txt"}
UNSUPPORTED_MESSAGE = "当前阶段仅支持 Markdown 和 TXT，PDF/Word/PPTX 将在后续阶段扩展。"


def _read_utf8(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig")


def parse_markdown(path: Path) -> str:
    return _read_utf8(path)


def parse_text(path: Path) -> str:
    return _read_utf8(path)


def parse_document(path: Path) -> tuple[str, str]:
    suffix = path.suffix.lower()
    if suffix == ".md":
        return parse_markdown(path), "md"
    if suffix == ".txt":
        return parse_text(path), "txt"
    raise ValueError(UNSUPPORTED_MESSAGE)
