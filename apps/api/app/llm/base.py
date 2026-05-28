from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    provider_name: str
    model_name: str
    uses_mock: bool

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        response_format: str | None = None,
    ) -> str:
        raise NotImplementedError

    @abstractmethod
    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        response_format: str | None = None,
    ) -> str:
        raise NotImplementedError

    @abstractmethod
    def status(self) -> dict[str, str | bool | None]:
        raise NotImplementedError


ProviderStatus = dict[str, Any]
