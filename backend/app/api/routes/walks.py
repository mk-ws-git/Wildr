from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.walk import Walk
from app.models.walk_stop import WalkStop
from app.schemas.walk import WalkCreate, WalkResponse, WalkStopResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db

router = APIRouter()


@router.get("", response_model=list[WalkResponse])
async def list_walks(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Walk).order_by(Walk.created_at.desc()))
    return result.scalars().all()


@router.get("/{walk_id}", response_model=WalkResponse)
async def get_walk(
    walk_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Walk).where(Walk.id == walk_id))
    walk = result.scalar_one_or_none()
    if not walk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Walk not found")
    return walk


@router.post("", response_model=WalkResponse, status_code=status.HTTP_201_CREATED)
async def create_walk(
    body: WalkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    walk = Walk(
        created_by=current_user.id,
        name=body.name,
        description=body.description,
        difficulty=body.difficulty,
        estimated_duration_minutes=body.estimated_duration_minutes,
    )
    db.add(walk)
    await db.commit()
    await db.refresh(walk)
    return walk


@router.get("/{walk_id}/stops", response_model=list[WalkStopResponse])
async def get_walk_stops(
    walk_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        select(WalkStop)
        .where(WalkStop.walk_id == walk_id)
        .order_by(WalkStop.stop_order)
    )
    return result.scalars().all()