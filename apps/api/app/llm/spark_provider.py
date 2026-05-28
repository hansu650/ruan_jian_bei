from app.llm.base import LLMProvider

PLACEHOLDER_MESSAGE = (
    "SparkProvider 为科大讯飞相关工具接入预留接口。"
    "当前阶段尚未接入真实讯飞星火 API，等待 A3 答疑群确认具体要求后再实现。"
)


class SparkProvider(LLMProvider):
    provider_name = "spark"
    uses_mock = False

    def __init__(self, model_name: str = "") -> None:
        self.model_name = model_name or "spark-placeholder"

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        response_format: str | None = None,
    ) -> str:
        del prompt, system_prompt, temperature, response_format
        return PLACEHOLDER_MESSAGE

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        response_format: str | None = None,
    ) -> str:
        del messages, temperature, response_format
        return PLACEHOLDER_MESSAGE

    def status(self) -> dict[str, str | bool | None]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": False,
            "uses_mock": False,
            "warning": PLACEHOLDER_MESSAGE,
        }
