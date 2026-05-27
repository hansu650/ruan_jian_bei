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
    try:
        completed = subprocess.run(
            command,
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


def check_project_files(reporter: Reporter) -> None:
    root = Path.cwd()
    root_markers = ["apps", "scripts", "README.md"]
    missing_markers = [marker for marker in root_markers if not (root / marker).exists()]

    if missing_markers:
        reporter.error(
            "当前目录不像项目根目录，缺少：" + "、".join(missing_markers)
        )
    else:
        reporter.ok(f"当前目录像项目根目录：{root}")

    required_files = [
        Path("apps/api/pyproject.toml"),
        Path("apps/api/requirements.txt"),
        Path(".env.example"),
    ]
    for file_path in required_files:
        if (root / file_path).exists():
            reporter.ok(f"文件存在：{file_path.as_posix()}")
        else:
            reporter.error(f"文件缺失：{file_path.as_posix()}")


def print_next_steps() -> None:
    print()
    print("下一步建议：")
    print("1. 创建环境：")
    print(f"   conda create -n {TARGET_CONDA_ENV} python=3.11 -y")
    print("2. 激活环境：")
    print(f"   conda activate {TARGET_CONDA_ENV}")
    print("3. 安装依赖：")
    print("   cd apps/api")
    print("   pip install -r requirements.txt")
    print("   pip install -r requirements-dev.txt")
    print("   pip install -e .")
    print("4. 启动后端：")
    print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    print("5. 安装 pnpm：")
    print("   corepack enable")
    print("   corepack prepare pnpm@latest --activate")


def main() -> int:
    reporter = Reporter()

    print("EduForge 智学工坊 - 第一阶段环境自检")
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
        required=False,
        install_hint="第一阶段尚未创建前端项目，可稍后安装",
    )
    check_executable("git", ["git", "--version"], reporter, required=True)
    check_executable(
        "docker",
        ["docker", "--version"],
        reporter,
        required=False,
        install_hint="Docker 为可选工具",
    )
    check_project_files(reporter)
    print_next_steps()

    if reporter.has_error:
        print()
        print("[ERROR] 环境自检未通过，请根据上面的错误信息修复后重试。")
        return 1

    print()
    print("[OK] 环境自检通过，可以继续启动后端或运行测试。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
