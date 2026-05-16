from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.deps import get_current_user
from app.models.badge import Badge
from app.models.user import User
from app.models.user_badge import UserBadge
from app.schemas.badge import BadgeResponse, UserBadgeResponse

router = APIRouter(prefix="/badges", tags=["badges"])

@router.get("", response_model=list[BadgeResponse])
async def list_badges(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Badge).order_by(Badge.name))
    return result.scalars().all()

@router.get("/me", response_model=list[UserBadgeResponse])
async def my_badges(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == current_user.id)
        .order_by(UserBadge.earned_at.desc())
    )
    rows = result.all()
    return [UserBadgeResponse(badge=badge, earned_at=ub.earned_at) for ub, badge in rows]


@router.get("/user/{user_id}", response_model=list[UserBadgeResponse])
async def user_badges(
    user_id: int,
    _: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .where(UserBadge.user_id == user_id)
        .order_by(UserBadge.earned_at.desc())
    )
    rows = result.all()
    return [UserBadgeResponse(badge=badge, earned_at=ub.earned_at) for ub, badge in rows]