from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..auth import login, register

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(LoginRequest):
    pass


@router.post("/login")
def authenticate(body: LoginRequest) -> dict:
    token = login(body.username, body.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"access_token": token, "token_type": "bearer", "expires_in": 43200, "username": body.username}


@router.post("/register")
def create_account(body: RegisterRequest) -> dict:
    try:
        token = register(body.username, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"access_token": token, "token_type": "bearer", "expires_in": 43200, "username": body.username.strip()}
