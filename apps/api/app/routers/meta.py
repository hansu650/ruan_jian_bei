from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.schemas.meta import MetaResponse

router = APIRouter(prefix="/api", tags=["meta"])
SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.get("/meta", response_model=MetaResponse)
def project_meta(settings: SettingsDep) -> MetaResponse:
    return MetaResponse(
        app_name=settings.app_name,
        display_name=settings.app_display_name,
        competition_name=settings.competition_name,
        competition_track=settings.competition_track,
        competition_topic=settings.competition_topic,
        project_positioning="面向高校课程学习场景的 AI 个性化学习资源工厂",
        core_loop=[
            "对话画像",
            "知识库检索",
            "多智能体协作",
            "学习路径",
            "资源生成",
            "测验反馈",
            "动态推荐",
        ],
        implemented_features=[
            "后端健康检查",
            "前端基础骨架",
            "前后端联调",
        ],
        planned_features=[
            "课程知识库",
            "对话式学习画像",
            "多智能体编排",
            "个性化学习路径",
            "多类型资源生成",
            "智能辅导",
            "测验批改",
            "学习效果评估",
            "防幻觉校验",
        ],
    )
