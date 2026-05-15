import secrets
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.core.deps import get_current_user
from app.models.invitation import Invitation
from app.models.user import User
from app.schemas.invitation import InvitationCreate, InvitationResponse
from app.services.email import send_invite_email

router = APIRouter()

MAX_PENDING_INVITES = 20
RESEND_COOLDOWN_HOURS = 24


@router.post("", response_model=InvitationResponse, status_code=201)
async def send_invite(
    body: InvitationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    email = body.email.lower().strip()

    # Block inviting yourself
    if email == current_user.email.lower():
        raise HTTPException(status_code=400, detail="You can't invite yourself.")

    # Block if email is already registered
    existing_user = await db.execute(select(User).where(User.email == email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="That email already has a Wildr account.")

    # Check for recent invite to same address (cooldown)
    cooldown_cutoff = datetime.now(timezone.utc) - timedelta(hours=RESEND_COOLDOWN_HOURS)
    recent = await db.execute(
        select(Invitation).where(
            Invitation.inviter_id == current_user.id,
            Invitation.email == email,
            Invitation.created_at >= cooldown_cutoff,
        )
    )
    if recent.scalar_one_or_none():
        raise HTTPException(
            status_code=429,
            detail=f"You already sent an invite to {email} in the last {RESEND_COOLDOWN_HOURS} hours.",
        )

    # Cap total pending invites per user
    pending_count = await db.execute(
        select(Invitation).where(
            Invitation.inviter_id == current_user.id,
            Invitation.status == "pending",
        )
    )
    if len(pending_count.scalars().all()) >= MAX_PENDING_INVITES:
        raise HTTPException(
            status_code=429,
            detail=f"You have {MAX_PENDING_INVITES} pending invites. Wait for some to be accepted first.",
        )

    token = secrets.token_urlsafe(32)
    invite = Invitation(
        inviter_id=current_user.id,
        email=email,
        token=token,
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    await send_invite_email(
        to_email=email,
        inviter_name=current_user.username,
        invite_token=token,
    )

    return invite


@router.get("/me", response_model=list[InvitationResponse])
async def my_invites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invitation)
        .where(Invitation.inviter_id == current_user.id)
        .order_by(Invitation.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
