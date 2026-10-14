"""Small, dependency-free authentication helpers for the local web app."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import re
import threading
import time
from pathlib import Path

from fastapi import HTTPException, Request

from oculus._home import ensure_home

_AUTH_FILE = Path.home() / ".oculus" / "auth.json"
_TOKEN_TTL = 60 * 60 * 12
_AUTH_LOCK = threading.Lock()


def _config() -> dict:
    ensure_home()
    if _AUTH_FILE.exists():
        config = json.loads(_AUTH_FILE.read_text())
        # Migrate the original single-user format transparently.
        if "users" not in config:
            config = {
                "users": [{"username": config["username"], "password_hash": config["password_hash"]}],
                "secret": config["secret"],
            }
            _save_config(config)
        return config
    password = os.environ.get("OCULUS_PASSWORD") or "admin"
    config = {
        "users": [{
            "username": os.environ.get("OCULUS_USERNAME", "admin"),
            "password_hash": _hash_password(password),
        }],
        "secret": secrets.token_urlsafe(32),
    }
    _save_config(config)
    return config


def _save_config(config: dict) -> None:
    _AUTH_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary = _AUTH_FILE.with_suffix(".tmp")
    temporary.write_text(json.dumps(config, indent=2))
    temporary.replace(_AUTH_FILE)
    try:
        _AUTH_FILE.chmod(0o600)
    except OSError:
        pass


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"{base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def _check_password(password: str, encoded: str) -> bool:
    try:
        salt_b64, digest_b64 = encoded.split("$", 1)
        expected = _hash_password(password, base64.urlsafe_b64decode(salt_b64))
        return hmac.compare_digest(expected, encoded)
    except (ValueError, TypeError):
        return False


def login(username: str, password: str) -> str | None:
    config = _config()
    user = next((u for u in config["users"] if hmac.compare_digest(username, u["username"])), None)
    if user is None or not _check_password(password, user["password_hash"]):
        return None
    return _issue_token(config, username)


def _issue_token(config: dict, username: str) -> str:
    payload = {"sub": username, "exp": int(time.time()) + _TOKEN_TTL}
    raw = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    signature = hmac.new(config["secret"].encode(), raw.encode(), hashlib.sha256).hexdigest()
    return f"{raw}.{signature}"


def register(username: str, password: str) -> str:
    username = username.strip()
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,32}", username):
        raise ValueError("Username must be 3-32 characters: letters, numbers, '.', '_' or '-'.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    with _AUTH_LOCK:
        config = _config()
        if any(hmac.compare_digest(username, u["username"]) for u in config["users"]):
            raise ValueError("Username is already registered.")
        config["users"].append({"username": username, "password_hash": _hash_password(password)})
        _save_config(config)
        return _issue_token(config, username)


def verify_token(token: str | None) -> str | None:
    if not token or "." not in token:
        return None
    raw, signature = token.rsplit(".", 1)
    config = _config()
    expected = hmac.new(config["secret"].encode(), raw.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))
        if int(payload["exp"]) < int(time.time()):
            return None
        return str(payload["sub"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        return None


def require_auth(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    token = authorization.removeprefix("Bearer ").strip()
    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
