from app.core.config import Settings
from app.llm.base import LLMProvider
from app.llm.mock_provider import MockLLMProvider
from app.llm.spark_provider import SparkProvider


def get_llm_provider(settings: Settings) -> LLMProvider:
    provider_name = settings.llm_provider.lower().strip()
    if settings.use_mock_llm:
        return MockLLMProvider(settings.llm_model)
    if provider_name == "mock":
        return MockLLMProvider(settings.llm_model)
    if provider_name == "spark":
        return SparkProvider(settings.spark_model or settings.llm_model)
    return MockLLMProvider(
        settings.llm_model,
        fallback_reason=f"未知 LLM_PROVIDER={settings.llm_provider}，已回退到 MockLLMProvider。",
    )
