from __future__ import annotations

import importlib.util
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

TARGET_CONDA_ENV = "cnsoftbei_a3_eduforge"
MIN_PYTHON = (3, 11)
MIN_NODE = (20, 9)


class Reporter:
    def __init__(self) -> None:
        self.has_error = False

    def ok(self, message: str) -> None:
        print(f"[OK] {message}")

    def warn(self, message: str) -> None:
        print(f"[WARN] {message}")

    def error(self, message: str) -> None:
        self.has_error = True
        print(f"[ERROR] {message}")


def run_command(command: list[str]) -> tuple[int, str]:
    command_to_run = command
    if os.name == "nt" and command:
        resolved = shutil.which(command[0])
        if resolved and Path(resolved).suffix.lower() in {".cmd", ".bat"}:
            command_to_run = ["cmd", "/c", *command]
    try:
        completed = subprocess.run(
            command_to_run,
            check=False,
            capture_output=True,
            text=True,
        )
    except FileNotFoundError:
        return 127, ""
    return completed.returncode, (completed.stdout or completed.stderr or "").strip()


def parse_version(text: str) -> tuple[int, int, int] | None:
    match = re.search(r"v?(\d+)\.(\d+)(?:\.(\d+))?", text)
    if not match:
        return None
    return int(match.group(1)), int(match.group(2)), int(match.group(3) or 0)


def version_at_least(version: tuple[int, int, int], minimum: tuple[int, int]) -> bool:
    return version[:2] >= minimum


def check_python(reporter: Reporter) -> None:
    reporter.ok(f"Python 可用：{sys.executable}")
    current = sys.version_info
    version_text = f"{current.major}.{current.minor}.{current.micro}"
    if (current.major, current.minor) >= MIN_PYTHON:
        reporter.ok(f"Python 版本满足要求：{version_text}")
    else:
        reporter.error(f"Python 版本过低：{version_text}，需要 >= 3.11")


def check_conda(reporter: Reporter) -> None:
    conda_prefix = os.environ.get("CONDA_PREFIX")
    conda_env = os.environ.get("CONDA_DEFAULT_ENV")
    if conda_prefix:
        reporter.ok(f"当前处于 Conda 环境：{conda_env or conda_prefix}")
    else:
        reporter.warn("当前未检测到 Conda 环境，请确认是否已执行 conda activate")

    if conda_env == TARGET_CONDA_ENV:
        reporter.ok(f"Conda 环境名正确：{TARGET_CONDA_ENV}")
    else:
        reporter.warn(f"当前 Conda 环境名为 {conda_env or '未激活'}，推荐使用 {TARGET_CONDA_ENV}")


def check_pip(reporter: Reporter) -> None:
    code, output = run_command([sys.executable, "-m", "pip", "--version"])
    if code == 0:
        reporter.ok(f"pip 可用：{output}")
    else:
        reporter.error("pip 不可用，请先确认 Python 环境安装完整")


def check_import(module_name: str, reporter: Reporter, required: bool = True) -> None:
    if importlib.util.find_spec(module_name) is not None:
        reporter.ok(f"{module_name} 可导入")
    elif required:
        reporter.error(f"{module_name} 无法导入，请安装后端依赖")
    else:
        reporter.warn(f"{module_name} 无法导入")


def check_executable(
    name: str,
    command: list[str],
    reporter: Reporter,
    *,
    required: bool,
    min_version: tuple[int, int] | None = None,
    install_hint: str | None = None,
) -> None:
    if shutil.which(name) is None:
        message = f"{name} 未安装或不在 PATH 中"
        if install_hint:
            message = f"{message}，{install_hint}"
        if required:
            reporter.error(message)
        else:
            reporter.warn(message)
        return

    code, output = run_command(command)
    if code != 0:
        message = f"{name} 命令可找到，但执行失败"
        if install_hint:
            message = f"{message}，{install_hint}"
        if required:
            reporter.error(message)
        else:
            reporter.warn(message)
        return

    if min_version is None:
        reporter.ok(f"{name} 可用：{output}")
        return

    version = parse_version(output)
    if version is None:
        reporter.warn(f"{name} 可用，但无法解析版本：{output}")
        return

    if version_at_least(version, min_version):
        reporter.ok(f"{name} 版本满足要求：{output}")
    else:
        reporter.error(f"{name} 版本过低：{output}，需要 >= {min_version[0]}.{min_version[1]}")


def check_file(root: Path, relative_path: str, reporter: Reporter) -> None:
    if (root / relative_path).exists():
        reporter.ok(f"文件存在：{relative_path}")
    else:
        reporter.error(f"文件缺失：{relative_path}")


def check_optional_file(root: Path, relative_path: str, reporter: Reporter, hint: str) -> None:
    if (root / relative_path).exists():
        reporter.ok(f"文件存在：{relative_path}")
    else:
        reporter.warn(f"文件缺失：{relative_path}，{hint}")


def check_directory(
    root: Path,
    relative_path: str,
    reporter: Reporter,
    *,
    required: bool,
    hint: str | None = None,
) -> None:
    path = root / relative_path
    if path.exists() and path.is_dir():
        reporter.ok(f"目录存在：{relative_path}")
        return
    message = f"目录缺失：{relative_path}"
    if hint:
        message = f"{message}，{hint}"
    if required:
        reporter.error(message)
    else:
        reporter.warn(message)


def check_project_files(reporter: Reporter) -> None:
    root = Path.cwd()
    markers = ["apps", "scripts", "README.md"]
    missing = [marker for marker in markers if not (root / marker).exists()]
    if missing:
        reporter.error("当前目录不像项目根目录，缺少：" + "、".join(missing))
    else:
        reporter.ok(f"当前目录像项目根目录：{root}")

    required_files = [
        ".env.example",
        "package.json",
        "pnpm-workspace.yaml",
        "apps/api/pyproject.toml",
        "apps/api/requirements.txt",
        "apps/api/app/main.py",
        "apps/api/app/core/config.py",
        "apps/api/app/db/database.py",
        "apps/api/app/db/models.py",
        "apps/api/app/db/seed.py",
        "apps/api/app/routers/health.py",
        "apps/api/app/routers/meta.py",
        "apps/api/app/routers/documents.py",
        "apps/api/app/routers/llm.py",
        "apps/api/app/routers/profiles.py",
        "apps/api/app/routers/learning_paths.py",
        "apps/api/app/routers/generated_resources.py",
        "apps/api/app/routers/tutor.py",
        "apps/api/app/routers/practice.py",
        "apps/api/app/routers/evaluation.py",
        "apps/api/app/routers/demo.py",
        "apps/api/app/routers/qa.py",
        "apps/api/app/core/errors.py",
        "apps/api/app/agents/profile_agent.py",
        "apps/api/app/agents/planner_agent.py",
        "apps/api/app/agents/resource_agent.py",
        "apps/api/app/agents/tutor_agent.py",
        "apps/api/app/agents/citation_verifier.py",
        "apps/api/app/agents/practice_agent.py",
        "apps/api/app/agents/evaluator_agent.py",
        "apps/api/app/llm/spark_http_provider.py",
        "apps/api/app/services/document_indexer.py",
        "apps/api/app/services/search_service.py",
        "apps/api/app/services/llm_service.py",
        "apps/api/app/services/profile_service.py",
        "apps/api/app/services/learning_path_service.py",
        "apps/api/app/services/generated_resource_service.py",
        "apps/api/app/services/tutor_service.py",
        "apps/api/app/services/practice_service.py",
        "apps/api/app/services/evaluation_service.py",
        "apps/api/app/services/demo_service.py",
        "apps/api/app/services/qa_service.py",
        "apps/api/app/schemas/llm.py",
        "apps/api/app/schemas/profiles.py",
        "apps/api/app/schemas/learning_paths.py",
        "apps/api/app/schemas/generated_resources.py",
        "apps/api/app/schemas/tutor.py",
        "apps/api/app/schemas/practice.py",
        "apps/api/app/schemas/evaluation.py",
        "apps/api/app/schemas/demo.py",
        "apps/api/app/schemas/qa.py",
        "apps/api/app/prompts/profile_prompt.md",
        "apps/api/app/prompts/learning_path_prompt.md",
        "apps/api/app/prompts/resource_generation_prompt.md",
        "apps/api/app/prompts/tutor_agent_prompt.md",
        "apps/api/app/prompts/citation_verifier_prompt.md",
        "apps/api/app/prompts/practice_agent_prompt.md",
        "apps/api/app/prompts/evaluator_agent_prompt.md",
        "data/sample_courses/database_system/01_intro.md",
        "data/sample_courses/database_system/07_transaction.md",
        "data/sample_courses/database_system/08_index_btree.md",
        "docs/11_Phase11_演示工作台与稳定性打磨.md",
        "docs/12_Phase12_前端体验打磨与人工测试清单.md",
        "docs/13_Phase13_端到端彩排与缺陷修复.md",
        "docs/14_Phase14A_学生端UI修复与内容渲染.md",
        "docs/15_Phase14B_学生端体验修补与资源展示修复.md",
        "docs/15A_学生端UI升级与创新点包装.md",
        "docs/15B_全局UI重构与创新点包装.md",
        "docs/16A_全站UIV2大重构.md",
        "scripts/check-phase13.ps1",
        "scripts/check-phase13.sh",
        "scripts/check-phase14a.ps1",
        "scripts/check-phase14a.sh",
        "scripts/check-phase14b.ps1",
        "scripts/check-phase14b.sh",
        "scripts/check-phase15a.ps1",
        "scripts/check-phase15a.sh",
        "scripts/check-phase15b.ps1",
        "scripts/check-phase15b.sh",
        "scripts/check-phase16a.ps1",
        "scripts/check-phase16a.sh",
        "apps/web/package.json",
        "apps/web/app/page.tsx",
        "apps/web/app/learn/page.tsx",
        "apps/web/app/agents-flow/page.tsx",
        "apps/web/app/innovation/page.tsx",
        "apps/web/app/dashboard/page.tsx",
        "apps/web/app/knowledge-base/page.tsx",
        "apps/web/app/profile/page.tsx",
        "apps/web/app/learning-path/page.tsx",
        "apps/web/app/resources/page.tsx",
        "apps/web/app/tutor/page.tsx",
        "apps/web/app/practice/page.tsx",
        "apps/web/app/analytics/page.tsx",
        "apps/web/app/demo/page.tsx",
        "apps/web/app/qa/page.tsx",
        "apps/web/components/empty-state.tsx",
        "apps/web/components/error-state.tsx",
        "apps/web/components/loading-state.tsx",
        "apps/web/components/model-mode-badge.tsx",
        "apps/web/components/demo-step-card.tsx",
        "apps/web/components/page-header.tsx",
        "apps/web/components/citation-list.tsx",
        "apps/web/components/json-preview.tsx",
        "apps/web/components/markdown-preview.tsx",
        "apps/web/components/mermaid-diagram.tsx",
        "apps/web/components/live-model-warning.tsx",
        "apps/web/components/action-confirm-card.tsx",
        "apps/web/components/status-badge.tsx",
        "apps/web/components/metric-card.tsx",
        "apps/web/components/resource-type-badge.tsx",
        "apps/web/components/agent-flow-card.tsx",
        "apps/web/components/innovation-card.tsx",
        "apps/web/components/learning-progress-overview.tsx",
        "apps/web/components/v2/app-shell.tsx",
        "apps/web/components/v2/student-sidebar.tsx",
        "apps/web/components/v2/student-topbar.tsx",
        "apps/web/components/v2/page-container.tsx",
        "apps/web/components/v2/page-hero.tsx",
        "apps/web/components/v2/section-card.tsx",
        "apps/web/components/v2/stat-card.tsx",
        "apps/web/components/v2/learning-task-card.tsx",
        "apps/web/components/v2/learning-step-card.tsx",
        "apps/web/components/v2/resource-preview-card.tsx",
        "apps/web/components/v2/agent-card.tsx",
        "apps/web/components/v2/innovation-card.tsx",
        "apps/web/components/v2/status-pill.tsx",
        "apps/web/components/v2/empty-panel.tsx",
        "apps/web/components/v2/error-panel.tsx",
        "apps/web/lib/api.ts",
        "apps/web/lib/types.ts",
    ]
    for file_path in required_files:
        check_file(root, file_path, reporter)

    if (root / "apps/web/pnpm-lock.yaml").exists():
        reporter.ok("文件存在：apps/web/pnpm-lock.yaml")
    elif (root / "pnpm-lock.yaml").exists():
        reporter.ok("文件存在：pnpm-lock.yaml（pnpm workspace 根锁文件）")
    else:
        reporter.error("文件缺失：pnpm-lock.yaml")

    check_directory(
        root,
        "apps/web/node_modules",
        reporter,
        required=False,
        hint="请运行 cd apps/web && pnpm install",
    )
    check_optional_file(
        root,
        "apps/api/eduforge.db",
        reporter,
        "后端启动后会自动创建 SQLite 数据库",
    )
    check_directory(
        root,
        "apps/api/storage/uploads",
        reporter,
        required=False,
        hint="上传课程资料后会自动创建",
    )
    if os.environ.get("SPARK_API_KEY"):
        reporter.ok("SPARK_API_KEY 已配置（自检不会读取或输出密钥内容）")
    else:
        reporter.warn("SPARK_API_KEY 未配置；第十阶段默认使用 MockLLM，Spark 仍然只是预留接口")

    env_example = root / ".env.example"
    if env_example.exists():
        env_text = env_example.read_text(encoding="utf-8")
        spark_http_keys = ["SPARK_HTTP_API_PASSWORD", "SPARK_HTTP_API_URL", "SPARK_MODEL"]
        missing_spark_http_keys = [key for key in spark_http_keys if key not in env_text]
        if not missing_spark_http_keys:
            reporter.ok(".env.example 包含 Spark HTTP 可选配置占位")
        else:
            reporter.error(".env.example 缺少 Spark HTTP 可选配置占位")

    if os.environ.get("SPARK_HTTP_API_PASSWORD"):
        reporter.ok("Spark HTTP 本地密钥已配置（自检不会读取或输出密钥内容）")
    else:
        reporter.warn("Spark HTTP 本地密钥未配置；USE_MOCK_LLM=true 时这是正常状态")


def print_next_steps() -> None:
    print()
    print("下一步建议：")
    print("1. 创建并激活后端环境：")
    print(f"   conda create -n {TARGET_CONDA_ENV} python=3.11 -y")
    print(f"   conda activate {TARGET_CONDA_ENV}")
    print("2. 安装后端依赖：")
    print("   cd apps/api")
    print("   pip install -r requirements.txt")
    print("   pip install -r requirements-dev.txt")
    print("   pip install -e .")
    print("3. 安装前端依赖：")
    print("   cd apps/web")
    print("   pnpm install")
    print("4. 启动后端：")
    print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("5. 启动前端：")
    print("   cd apps/web")
    print("   pnpm dev")
    print("6. 打开学生端与 Phase 16A 检查页面：")
    print("   http://localhost:3000/learn")
    print("   http://localhost:3000/agents-flow")
    print("   http://localhost:3000/innovation")
    print("   http://localhost:3000/demo")
    print("   http://localhost:3000/qa")
    print("   http://localhost:3000/practice")
    print("   http://localhost:3000/analytics")
    print("7. 一键检查 Phase 16A：")
    print("   .\\scripts\\check-phase16a.ps1")
    print("   ./scripts/check-phase16a.sh")
    print("8. 一键检查 Phase 15B：")
    print("   .\\scripts\\check-phase15b.ps1")
    print("   ./scripts/check-phase15b.sh")
    print("9. 一键检查 Phase 15A：")
    print("   .\\scripts\\check-phase15a.ps1")
    print("   ./scripts/check-phase15a.sh")
    print("10. 一键检查 Phase 14B：")
    print("   .\\scripts\\check-phase14b.ps1")
    print("   ./scripts/check-phase14b.sh")
    print("11. 一键检查 Phase 14A：")
    print("   .\\scripts\\check-phase14a.ps1")
    print("   ./scripts/check-phase14a.sh")
    print("12. 一键检查 Phase 13：")
    print("   .\\scripts\\check-phase13.ps1")
    print("   ./scripts/check-phase13.sh")
    print("13. 一键检查 Phase 12：")
    print("   .\\scripts\\check-phase12.ps1")
    print("   ./scripts/check-phase12.sh")
    print("14. 一键检查 Phase 11：")
    print("   .\\scripts\\check-phase11.ps1")
    print("   ./scripts/check-phase11.sh")
    print("15. 一键检查第十阶段：")
    print("   .\\scripts\\check-phase10.ps1")
    print("   ./scripts/check-phase10.sh")
    print("16. 一键检查 Phase 10.1：")
    print("   .\\scripts\\check-phase10-1.ps1")
    print("   ./scripts/check-phase10-1.sh")


def main() -> int:
    reporter = Reporter()
    print("EduForge 智学工坊 - Phase 16A 全站 UI V2 大重构环境自检")
    print()

    check_python(reporter)
    check_conda(reporter)
    check_pip(reporter)
    check_import("fastapi", reporter)
    check_import("uvicorn", reporter)
    check_import("pytest", reporter)
    check_import("sqlmodel", reporter)
    check_import("multipart", reporter)
    check_executable("node", ["node", "--version"], reporter, required=True, min_version=MIN_NODE)
    check_executable(
        "pnpm",
        ["pnpm", "--version"],
        reporter,
        required=True,
        install_hint="请执行 corepack enable；corepack prepare pnpm@latest --activate",
    )
    check_executable("git", ["git", "--version"], reporter, required=True)
    check_executable(
        "docker",
        ["docker", "--version"],
        reporter,
        required=False,
        install_hint="Docker 为可选工具，后续阶段再配置",
    )
    check_project_files(reporter)
    print_next_steps()

    if reporter.has_error:
        print()
        print("[ERROR] 环境自检未通过，请根据上面的错误信息修复后重试。")
        return 1

    print()
    print("[OK] 环境自检通过，可以继续启动前后端或运行 Phase 16A 检查。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
