#!/usr/bin/env python3
"""Lightweight sync API for the AI learning site."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any


HOST = os.environ.get("AI_SYNC_HOST", "127.0.0.1")
PORT = int(os.environ.get("AI_SYNC_PORT", "8090"))
DATA_DIR = Path(os.environ.get("AI_SYNC_DATA_DIR", "/home/ubuntu/ai-learning-site/data"))
DATA_FILE = DATA_DIR / "sync-data.json"


def ensure_data_dir() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)


def read_payload() -> dict[str, Any] | None:
    if not DATA_FILE.exists():
        return None

    with DATA_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_payload(payload: dict[str, Any]) -> dict[str, Any]:
    ensure_data_dir()
    data = {
        "weeklyPlan": payload.get("weeklyPlan", {}),
        "dailyLogs": payload.get("dailyLogs", []),
        "weeklyReview": payload.get("weeklyReview", {}),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    with DATA_FILE.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    return data


class SyncRequestHandler(BaseHTTPRequestHandler):
    server_version = "AILearningSync/1.0"

    def _send_json(self, status: HTTPStatus, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))

        if content_length <= 0:
            raise ValueError("empty body")

        raw = self.rfile.read(content_length)
        return json.loads(raw.decode("utf-8"))

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/api/sync":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})
            return

        payload = read_payload()
        if payload is None:
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "no synced data yet"})
            return

        self._send_json(HTTPStatus.OK, payload)

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/sync":
            self._send_json(HTTPStatus.NOT_FOUND, {"error": "not found"})
            return

        try:
            payload = self._read_json_body()
            saved = write_payload(payload)
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "invalid json"})
            return
        except ValueError as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})
            return
        except OSError as error:
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": str(error)})
            return

        self._send_json(HTTPStatus.OK, saved)

    def log_message(self, format: str, *args: Any) -> None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        message = format % args
        print(f"[{timestamp}] {self.address_string()} {message}")


def main() -> None:
    ensure_data_dir()
    server = ThreadingHTTPServer((HOST, PORT), SyncRequestHandler)
    print(f"Sync server listening on http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
