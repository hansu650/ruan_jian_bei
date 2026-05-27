from fastapi import FastAPI

app = FastAPI(
    title="EduForge API",
    description="EduForge 智学工坊后端环境健康检查服务",
    version="0.1.0",
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "eduforge-api",
        "project": "EduForge 智学工坊",
        "competition": "中国软件杯 A3",
    }
