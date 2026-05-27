from dataclasses import dataclass
from typing import Any


@dataclass
class AgentResult:
    content: str
    parsed: dict[str, Any]
    llm_log_id: int | None = None
    latency_ms: int | None = None
