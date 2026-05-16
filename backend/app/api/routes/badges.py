from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.core.deps import get_current_user
from app.models.badge import Badge
from app.models.user import User
from app.models.user_badge import UserBadge
from app.schemas.badge import BadgeResponse, UserBadgeResponse, BadgeWithStatusResponse

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


@router.get("/me/status", response_model=list[BadgeWithStatusResponse])
async def my_badges_with_status(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """All badges in the system, with earned status for the current user."""
    all_badges_result = await db.execute(select(Badge).order_by(Badge.category, Badge.name))
    all_badges = all_badges_result.scalars().all()

    earned_result = await db.execute(
        select(UserBadge)
        .where(UserBadge.user_id == current_user.id)
    )
    earned_map = {ub.badge_id: ub.earned_at for ub in earned_result.scalars().all()}

    return [
        BadgeWithStatusResponse(
            badge=badge,
            earned=badge.id in earned_map,
            earned_at=earned_map.get(badge.id),
        )
        for badge in all_badges
    ]


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