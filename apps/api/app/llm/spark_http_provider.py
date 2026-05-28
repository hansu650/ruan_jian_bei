from typing import Any

import httpx

from app.llm.base import LLMProvider


class SparkHTTPProvider(LLMProvider):
    provider_name = "spark-http"
    uses_mock = False

    def __init__(
        self,
        *,
        model_name: str = "lite",
        api_url: str,
        api_password: str,
        timeout_seconds: int = 60,
    ) -> None:
        self.model_name = model_name or "lite"
        self.api_url = api_url
        self.api_password = api_password
        self.timeout_seconds = timeout_seconds

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        temperature: float = 0.2,
        response_format: str | None = None,
    ) -> str:
        messages: list[dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return self.chat(
            messages=messages,
            temperature=temperature,
            response_format=response_format,
        )

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        response_format: str | None = None,
    ) -> str:
        if not self.api_url:
            raise RuntimeError("Spark HTTP API URL 未配置")
        if not self.api_password:
            raise RuntimeError("Spark HTTP APIPassword 未配置")

        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": self._normalize_messages(messages),
            "temperature": temperature,
            "stream": False,
        }
        if response_format == "json_object":
            payload["response_format"] = {"type": "json_object"}

        response = httpx.post(
            self.api_url,
            headers={
                "Authorization": f"Bearer {self.api_password}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=self.timeout_seconds,
        )
        if response.status_code < 200 or response.status_code >= 300:
            raise RuntimeError(
                f"Spark HTTP API 请求失败，status_code={response.status_code}。"
            )

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(
                "Spark HTTP API 响应结构异常，未找到 choices[0].message.content"
            ) from exc
        if not isinstance(content, str):
            raise RuntimeError("Spark HTTP API 响应内容不是字符串")
        return content

    def status(self) -> dict[str, str | bool | None]:
        return {
            "provider": self.provider_name,
            "model": self.model_name,
            "configured": bool(self.api_url and self.api_password),
            "uses_mock": False,
            "api_url_configured": bool(self.api_url),
            "api_password_configured": bool(self.api_password),
            "warning": None,
        }

    @staticmethod
    def _normalize_messages(messages: list[dict[str, str]]) -> list[dict[str, str]]:
        normalized: list[dict[str, str]] = []
        for message in messages:
            role = message.get("role", "user")
            if role not in {"system", "user", "assistant"}:
                role = "user"
            normalized.append(
                {
                    "role": role,
                    "content": str(message.get("content", "")),
                }
            )
        return normalized
