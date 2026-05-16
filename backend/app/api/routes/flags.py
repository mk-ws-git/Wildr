from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.content_flag import ContentFlag

router = APIRouter()

VALID_TYPES = {"location", "greenspace", "species"}


class FlagCreate(BaseModel):
    content_type: str
    content_id: int
    reason: str

    @field_validator("content_type")
    @classmethod
    def check_type(cls, v):
        if v not in VALID_TYPES:
            raise ValueError(f"content_type must be one of {VALID_TYPES}")
        return v

    @field_validator("reason")
    @classmethod
    def check_reason(cls, v):
        v = v.strip()
        if len(v) < 5:
            raise ValueError("reason must be at least 5 characters")
        return v[:500]


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def submit_flag(
    body: FlagCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Any logged-in user can flag incorrect information for admin review."""
    flag = ContentFlag(
        user_id=current_user.id,
        content_type=body.content_type,
        content_id=body.content_id,
        reason=body.reason,
    )
    db.add(flag)
    await db.commit()


@router.get("/admin", dependencies=[])
async def list_flags(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: list open flags. Gated by role on the user record."""
    if getattr(current_user, "role", "user") not in ("trusted", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    rows = (await db.execute(
        select(ContentFlag)
        .where(ContentFlag.status == "open")
        .order_by(ContentFlag.created_at.desc())
        .limit(200)
    )).scalars().all()
    return [
        {
            "id": r.id,
            "content_type": r.content_type,
            "content_id": r.content_id,
            "reason": r.reason,
            "created_at": r.created_at,
        }
        for r in rows
    ]


@router.patch("/admin/{flag_id}")
async def resolve_flag(
    flag_id: int,
    body: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if getattr(current_user, "role", "user") not in ("trusted", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    flag = (await db.execute(select(ContentFlag).where(ContentFlag.id == flag_id))).scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404)
    new_status = body.get("status", "resolved")
    if new_status not in ("resolved", "dismissed"):
        raise HTTPException(status_code=422, detail="status must be resolved or dismissed")
    flag.status = new_status
    db.add(flag)
    await db.commit()
    return {"ok": True}
