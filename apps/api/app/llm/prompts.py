from pathlib import Path

PROMPT_DIR = Path(__file__).resolve().parents[1] / "prompts"


def load_prompt_template(name: str) -> str:
    safe_name = Path(name).name
    path = PROMPT_DIR / safe_name
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found: {safe_name}")
    return path.read_text(encoding="utf-8")
