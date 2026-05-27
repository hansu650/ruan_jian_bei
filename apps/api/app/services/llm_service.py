from time import perf_counter

from sqlmodel import Session, col, select

from app.core.config import get_settings
from app.db.models import LLMCallLog
from app.llm.factory import get_llm_provider
from app.llm.spark_provider import SparkProvider
from app.schemas.llm import (
    LLMCallLogRead,
    LLMChatRequest,
    LLMChatResponse,
    LLMGenerateRequest,
    LLMGenerateResponse,
    LLMMessage,
    LLMScenario,
    LLMStatusResponse,
)

SCENARIOS = [
    LLMScenario(
        key="general",
        title="通用演示",
        description="验证 MockLLM 基础回复，不代表真实模型能力。",
        sample_prompt="请用两句话说明 EduForge 当前第五阶段在做什么。",
    ),
    LLMScenario(
        key="profile",
        title="学习画像草稿",
        description="返回可解析 JSON，为后续 ProfileAgent 做准备。",
        sample_prompt="学生大二，计算机专业，7天复习数据库，SQL中等，事务和索引薄弱。",
    ),
    LLMScenario(
        key="learning_path",
        title="学习路径草稿",
        description="返回可解析 JSON，演示后续路径规划输出形态。",
        sample_prompt="请为数据库系统期末复习生成 7 天学习路径，重点补事务、JOIN 和 B+树。",
    ),
    LLMScenario(
        key="resource_note",
        title="讲义草稿",
        description="返回 Markdown，演示后续资源生成输出形态。",
        sample_prompt="请生成一份事务隔离级别速记讲义，适合大二学生。",
    ),
    LLMScenario(
        key="quiz",
        title="练习题草稿",
        description="返回可解析 JSON，演示后续测验生成形态。",
        sample_prompt="请围绕幻读和 B+树生成两道练习题。",
    ),
    LLMScenario(
        key="tutor",
        title="智能答疑草稿",
        description="返回带模拟引用来源的解释，当前不是真正 RAG。",
        sample_prompt="为什么可重复读下还要讨论幻读？请结合数据库系统课程解释。",
    ),
    LLMScenario(
        key="safety_check",
        title="安全检查",
        description="返回 JSON，演示后续版权和防幻觉检查输出形态。",
        sample_prompt="检查这段内容是否可以用于课程讲义。",
    ),
]


def _preview(text: str, limit: int = 500) -> str:
    cleaned = " ".join(text.split())
    return cleaned[:limit]


def _messages_preview(messages: list[LLMMessage]) -> str:
    return "\n".join(f"{message.role}: {message.content}" for message in messages)


def _latency_ms(start: float) -> int:
    return int((perf_counter() - start) * 1000)


def _save_log(
    session: Session,
    *,
    provider: str,
    model: str,
    scenario: str,
    prompt: str,
    response: str | None,
    status: str,
    latency_ms: int | None,
    error_message: str | None = None,
) -> LLMCallLog:
    log = LLMCallLog(
        provider=provider,
        model=model,
        scenario=scenario,
        prompt_preview=_preview(prompt),
        response_preview=_preview(response) if response else None,
        status=status,
        error_message=_preview(error_message) if error_message else None,
        latency_ms=latency_ms,
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log


def _call_status(provider_type: object) -> str:
    return "placeholder" if isinstance(provider_type, SparkProvider) else "success"


def get_provider_status(session: Session) -> LLMStatusResponse:
    del session
    settings = get_settings()
    provider = get_llm_provider(settings)
    provider_status = provider.status()
    spark_configured = bool(
        settings.spark_app_id and settings.spark_api_key and settings.spark_api_secret
    )
    warning = provider_status.get("warning")
    return LLMStatusResponse(
        provider=settings.llm_provider,
        model=provider.model_name,
        use_mock_llm=settings.use_mock_llm,
        effective_provider=provider.provider_name,
        spark_configured=spark_configured,
        status="ready" if provider.uses_mock else "placeholder",
        warning=str(warning) if warning else None,
    )


def generate_text(request: LLMGenerateRequest, session: Session) -> LLMGenerateResponse:
    settings = get_settings()
    provider = get_llm_provider(settings)
    prompt = f"scenario:{request.scenario}\n{request.prompt}"
    start = perf_counter()
    try:
        content = provider.generate(
            prompt=prompt,
            system_prompt=request.system_prompt,
            temperature=request.temperature,
        )
        latency = _latency_ms(start)
        log = _save_log(
            session,
            provider=provider.provider_name,
            model=provider.model_name,
            scenario=request.scenario,
            prompt=f"{request.system_prompt or ''}\n{request.prompt}",
            response=content,
            status=_call_status(provider),
            latency_ms=latency,
        )
        return LLMGenerateResponse(
            content=content,
            provider=provider.provider_name,
            model=provider.model_name,
            scenario=request.scenario,
            used_mock=provider.uses_mock,
            latency_ms=latency,
            log_id=log.id,
        )
    except Exception as exc:
        latency = _latency_ms(start)
        _save_log(
            session,
            provider=provider.provider_name,
            model=provider.model_name,
            scenario=request.scenario,
            prompt=request.prompt,
            response=None,
            status="failed",
            latency_ms=latency,
            error_message=str(exc),
        )
        raise


def chat_text(request: LLMChatRequest, session: Session) -> LLMChatResponse:
    settings = get_settings()
    provider = get_llm_provider(settings)
    messages = [
        {"role": "system", "content": f"scenario:{request.scenario}"},
        *[message.model_dump() for message in request.messages],
    ]
    start = perf_counter()
    try:
        content = provider.chat(messages=messages, temperature=request.temperature)
        latency = _latency_ms(start)
        log = _save_log(
            session,
            provider=provider.provider_name,
            model=provider.model_name,
            scenario=request.scenario,
            prompt=_messages_preview(request.messages),
            response=content,
            status=_call_status(provider),
            latency_ms=latency,
        )
        return LLMChatResponse(
            content=content,
            provider=provider.provider_name,
            model=provider.model_name,
            scenario=request.scenario,
            used_mock=provider.uses_mock,
            latency_ms=latency,
            log_id=log.id,
        )
    except Exception as exc:
        latency = _latency_ms(start)
        _save_log(
            session,
            provider=provider.provider_name,
            model=provider.model_name,
            scenario=request.scenario,
            prompt=_messages_preview(request.messages),
            response=None,
            status="failed",
            latency_ms=latency,
            error_message=str(exc),
        )
        raise


def list_llm_scenarios() -> list[LLMScenario]:
    return SCENARIOS


def list_llm_logs(session: Session, limit: int = 50) -> list[LLMCallLogRead]:
    safe_limit = max(1, min(limit, 100))
    statement = select(LLMCallLog).order_by(col(LLMCallLog.id).desc()).limit(safe_limit)
    logs = session.exec(statement).all()
    return [LLMCallLogRead.model_validate(log, from_attributes=True) for log in logs]
