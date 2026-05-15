import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.password_reset import PasswordReset
from app.models.invitation import Invitation
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token

router = APIRouter()

class RegisterRequest(UserCreate):
    invite_token: str | None = None


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(User).where((User.email == data.email) | (User.username == data.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email or username already taken")

    user = User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password)
    )
    db.add(user)
    await db.flush()  # get user.id before committing

    # Consume the invite token if provided
    if data.invite_token:
        inv_result = await db.execute(
            select(Invitation).where(
                Invitation.token == data.invite_token,
                Invitation.status == "pending",
            )
        )
        invite = inv_result.scalar_one_or_none()
        if invite:
            invite.status = "accepted"
            invite.accepted_at = datetime.now(timezone.utc)
            invite.invitee_id = user.id

    await db.commit()
    await db.refresh(user)
    return user

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return Token(access_token=create_access_token(user.id))


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    # Always return success to avoid leaking which emails exist
    if not user:
        return {"message": "If that email is registered you will receive a reset link."}

    token = secrets.token_urlsafe(32)
    reset = PasswordReset(email=data.email, token=token)
    db.add(reset)
    await db.commit()

    # No email service configured yet — return token directly for dev use
    return {
        "message": "Reset token generated.",
        "reset_token": token,
        "note": "No email service configured. Use this token at /reset-password.",
    }


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token == data.token,
            PasswordReset.used == False,
        )
    )
    reset = result.scalar_one_or_none()

    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    expiry = reset.created_at.replace(tzinfo=timezone.utc) + timedelta(hours=1)
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(status_code=400, detail="Reset token has expired.")

    user_result = await db.execute(select(User).where(User.email == reset.email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    user.hashed_password = hash_password(data.new_password)
    reset.used = True
    await db.commit()
    return {"message": "Password updated. You can now log in."}