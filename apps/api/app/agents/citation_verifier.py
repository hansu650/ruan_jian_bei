from typing import Any

COPYRIGHT_RISK_KEYWORDS = [
    "复制教材原文",
    "教材 PDF",
    "教材PDF",
    "上传教材 PDF",
    "上传教材PDF",
    "提取整本书原文",
    "整本书原文",
    "输出扫描件内容",
    "扫描件内容",
    "出版教材原文",
]

UNSUPPORTED_SOURCE_HINTS = [
    "根据教材第",
    "某某出版社",
    "出版社第",
    "课本第",
    "教材第",
]


class CitationVerifier:
    """Lightweight citation and copyright boundary checker for phase 9."""

    def verify(
        self,
        *,
        question: str,
        answer: str,
        citations: list[dict[str, Any]],
    ) -> dict[str, Any]:
        issues: list[str] = []
        normalized_question = question.strip()
        normalized_answer = answer.strip()

        if self.has_copyright_risk(normalized_question):
            issues.append("问题涉及复制出版教材原文、教材 PDF 或扫描件内容的版权风险。")

        if not citations:
            issues.append("回答没有可追溯的课程知识库引用来源。")
        else:
            for index, citation in enumerate(citations, start=1):
                missing_fields = [
                    field
                    for field in ["chunk_id", "filename", "quote"]
                    if not citation.get(field)
                ]
                if missing_fields:
                    issues.append(f"第 {index} 条引用缺少字段：{', '.join(missing_fields)}。")

        if any(hint in normalized_answer for hint in UNSUPPORTED_SOURCE_HINTS):
            issues.append("回答出现未由 citations 支撑的教材页码或出版社来源表述。")

        if self.has_copyright_risk(normalized_question):
            safety_status = "unsafe"
            confidence_score = 0.1
            summary = "检测到版权风险请求，系统不会复制出版教材原文或扫描件。"
        elif citations and not issues:
            safety_status = "grounded"
            confidence_score = 0.85
            summary = "回答包含课程知识库引用，当前轻量校验通过。"
        else:
            safety_status = "needs_review"
            confidence_score = 0.45
            summary = "回答来源不足或引用字段不完整，建议教师确认。"

        return {
            "safety_status": safety_status,
            "confidence_score": confidence_score,
            "issues": issues,
            "summary": summary,
        }

    def has_copyright_risk(self, text: str) -> bool:
        return any(keyword in text for keyword in COPYRIGHT_RISK_KEYWORDS)
