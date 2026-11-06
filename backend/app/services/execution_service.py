import asyncio
import subprocess
import uuid

DEFAULT_TIMEOUT_S = 5
DEFAULT_MEMORY = "128m"
DEFAULT_CPUS = "0.5"
MAX_OUTPUT = 100_000
MAX_CODE = 50_000

RUNNERS = {
    "python": {
        "image": "python:3.12-alpine",
        "cmd": ["python", "-"],
    },
    "javascript": {
        "image": "node:20-alpine",
        "cmd": ["node", "-"],
    },
    "typescript": {
        "image": "node:24-alpine",
        "cmd": [
            "sh", "-c",
            "cat > /tmp/main.ts && node --disable-warning=ExperimentalWarning /tmp/main.ts",
        ],
    },
    "java": {
        "image": "eclipse-temurin:21-jdk-alpine",
        "cmd": [
            "sh", "-c",
            "cat > /tmp/Main.java && java -Xmx256m /tmp/Main.java",
        ],
        "memory": "512m",
        "cpus": "1",
        "timeout": 15,
    },
}


class UnsupportedLanguage(Exception):
    pass


class CodeTooLarge(Exception):
    pass


def _run_docker_sync(args, name, source_code, timeout):
    try:
        proc = subprocess.run(
            args,
            input=source_code.encode(),
            capture_output=True,
            timeout=timeout,
        )
        return proc.stdout, proc.stderr, proc.returncode, False
    except FileNotFoundError:
        return b"", b"Docker is not installed or not on PATH", -1, False
    except subprocess.TimeoutExpired as e:
        # the docker client was killed; also stop the container itself
        subprocess.run(["docker", "kill", name], capture_output=True)
        return e.stdout or b"", e.stderr or b"", -1, True


async def run_in_docker(runner, source_code: str):
    name = f"sandbox-{uuid.uuid4()}"
    memory = runner.get("memory", DEFAULT_MEMORY)
    cpus = runner.get("cpus", DEFAULT_CPUS)
    timeout = runner.get("timeout", DEFAULT_TIMEOUT_S)

    args = [
        "docker", "run", "--rm", "-i",
        "--name", name,
        "--network", "none",
        "--memory", memory, "--memory-swap", memory,
        "--cpus", cpus,
        "--pids-limit", "128",
        "--read-only",
        "--tmpfs", "/tmp:rw,exec,size=64m",
        "-e", "HOME=/tmp",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        "--user", "65534:65534",
        runner["image"], *runner["cmd"],
    ]

    # run the blocking docker call in a worker thread so the server stays responsive
    out, err, code, timed_out = await asyncio.to_thread(
        _run_docker_sync, args, name, source_code, timeout
    )

    stdout = out.decode(errors="replace")[:MAX_OUTPUT]
    stderr = err.decode(errors="replace")[:MAX_OUTPUT]
    if timed_out:
        stderr += f"\nExecution timed out after {timeout}s"
    return stdout, stderr, code


async def execute_code(language: str, source_code: str) -> dict:
    runner = RUNNERS.get(language)
    if not runner:
        raise UnsupportedLanguage(language)
    if len(source_code) > MAX_CODE:
        raise CodeTooLarge()

    stdout, stderr, code = await run_in_docker(runner, source_code)
    return {
        "language": language,
        "run": {
            "stdout": stdout,
            "stderr": stderr,
            "output": stdout + stderr,
            "code": code,
        },
    }