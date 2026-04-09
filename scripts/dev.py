#!/usr/bin/env python3
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MATERIALS = ROOT / "materials"


def snapshot():
    state = {}
    for path in MATERIALS.rglob("*"):
        if not path.is_file():
            continue
        if path.name.startswith("."):
            continue
        stat = path.stat()
        state[str(path.relative_to(ROOT))] = (stat.st_mtime_ns, stat.st_size)
    return state


def watch_materials(stop_event):
    previous = snapshot()
    while not stop_event.is_set():
        time.sleep(1)
        current = snapshot()
        if current != previous:
            previous = current
            print("[materials] change detected, triggering Jekyll rebuild...", flush=True)
            subprocess.run(
                [
                    "bundle",
                    "exec",
                    "jekyll",
                    "build",
                    "--config",
                    "_config.yml",
                    "--destination",
                    "_site",
                ],
                cwd=ROOT,
                check=False,
            )


def main():
    stop_event = threading.Event()
    command = [
        "bundle",
        "exec",
        "jekyll",
        "serve",
        "--config",
        "_config.yml",
        "--destination",
        "_site",
        "--force_polling",
    ]

    process = subprocess.Popen(command, cwd=ROOT)
    watcher = threading.Thread(target=watch_materials, args=(stop_event,), daemon=True)
    watcher.start()

    def shutdown(*_args):
        stop_event.set()
        if process.poll() is None:
            process.send_signal(signal.SIGINT)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        return_code = process.wait()
    finally:
        shutdown()

    sys.exit(return_code)


if __name__ == "__main__":
    main()
