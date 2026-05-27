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
    output = (completed.stdout or completed.stderr or "").strip()
    return completed.returncode, output


def parse_version(text: str) -> tuple[int, int, int] | None:
    match = re.search(r"v?(\d+)\.(\d+)(?:\.(\d+))?", text)
    if not match:
        return None
    major = int(match.group(1))
    minor = int(match.group(2))
    patch = int(match.group(3) or 0)
    return major, minor, patch


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
        reporter.warn(
            f"当前 Conda 环境名为 {conda_env or '未激活'}，推荐使用 {TARGET_CONDA_ENV}"
        )


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
        reporter.error(
            f"{name} 版本过低：{output}，需要 >= {min_version[0]}.{min_version[1]}"
        )


def check_file(root: Path, relative_path: str, reporter: Reporter) -> None:
    if (root / relative_path).exists():
        reporter.ok(f"文件存在：{relative_path}")
    else:
        reporter.error(f"文件缺失：{relative_path}")


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
    root_markers = ["apps", "scripts", "README.md"]
    missing_markers = [marker for marker in root_markers if not (root / marker).exists()]

    if missing_markers:
        reporter.error("当前目录不像项目根目录，缺少：" + "、".join(missing_markers))
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
        "apps/api/app/routers/health.py",
        "apps/api/app/routers/meta.py",
        "apps/web/package.json",
        "apps/web/app/page.tsx",
        "apps/web/app/health/page.tsx",
        "apps/web/app/dashboard/page.tsx",
        "apps/web/lib/api.ts",
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
    print("6. 如果 pnpm 未安装：")
    print("   corepack enable")
    print("   corepack prepare pnpm@latest --activate")


def main() -> int:
    reporter = Reporter()

    print("EduForge 智学工坊 - 第二阶段环境自检")
    print()

    check_python(reporter)
    check_conda(reporter)
    check_pip(reporter)
    check_import("fastapi", reporter)
    check_import("uvicorn", reporter)
    check_import("pytest", reporter)
    check_executable("node", ["node", "--version"], reporter, required=True, min_version=MIN_NODE)
    check_executable(
        "pnpm",
        ["pnpm", "--version"],
        reporter,
        required=True,
        install_hint=(
            "第二阶段已创建前端项目，请执行 corepack enable；"
            "corepack prepare pnpm@latest --activate"
        ),
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
    print("[OK] 环境自检通过，可以继续启动前后端或运行第二阶段检查。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
