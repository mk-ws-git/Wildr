import uuid
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.walk import Walk
from app.models.walk_stop import WalkStop
from app.models.walk_sighting import WalkSighting
from app.models.walk_completion import WalkCompletion
from app.models.walk_review import WalkReview
from app.models.sighting import Sighting
from app.schemas.walk import (
    WalkCreate, WalkResponse, WalkStopCreate, WalkStopResponse,
    WalkCompletionResponse, WalkSightingResponse,
)
from app.schemas.review import ReviewCreate, ReviewUpdate, WalkReviewResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db
from app.utils.r2 import upload_file

router = APIRouter()


@router.get("", response_model=list[WalkResponse])
async def list_walks(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Walk).order_by(Walk.created_at.desc()))
    return result.scalars().all()


@router.get("/featured", response_model=list[WalkResponse])
async def featured_walks(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    from sqlalchemy import func, text as sa_text
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    rows = (await db.execute(
        select(Walk)
        .outerjoin(WalkCompletion, WalkCompletion.walk_id == Walk.id)
        .outerjoin(WalkReview, WalkReview.walk_id == Walk.id)
        .where(
            (WalkCompletion.completed_at >= cutoff) | (WalkCompletion.id.is_(None))
        )
        .group_by(Walk.id)
        .order_by(
            func.avg(WalkReview.rating).desc().nulls_last(),
            func.count(WalkCompletion.id).desc(),
        )
        .limit(5)
    )).scalars().all()
    return rows


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


@router.post("/{walk_id}/stops", response_model=WalkStopResponse, status_code=status.HTTP_201_CREATED)
async def add_walk_stop(
    walk_id: int,
    body: WalkStopCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    walk = (await db.execute(select(Walk).where(Walk.id == walk_id))).scalar_one_or_none()
    if not walk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Walk not found")
    if walk.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your walk")
    stop = WalkStop(
        walk_id=walk_id,
        location_id=body.location_id,
        stop_order=body.stop_order,
        description=body.description,
    )
    db.add(stop)
    await db.commit()
    await db.refresh(stop)
    return stop


@router.post("/{walk_id}/stops/{stop_id}/audio", response_model=WalkStopResponse)
async def upload_stop_audio(
    walk_id: int,
    stop_id: int,
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stop = (await db.execute(
        select(WalkStop).where(WalkStop.id == stop_id, WalkStop.walk_id == walk_id)
    )).scalar_one_or_none()
    if not stop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found")
    walk = (await db.execute(select(Walk).where(Walk.id == walk_id))).scalar_one_or_none()
    if walk.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your walk")
    audio_bytes = await audio.read()
    key = f"walks/audio/{uuid.uuid4()}.mp3"
    audio_url = await upload_file(audio_bytes, key, "audio/mpeg")
    stop.audio_url = audio_url
    db.add(stop)
    await db.commit()
    await db.refresh(stop)
    return stop


@router.post("/{walk_id}/sightings", response_model=WalkSightingResponse, status_code=status.HTTP_201_CREATED)
async def link_walk_sighting(
    walk_id: int,
    sighting_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    walk = (await db.execute(select(Walk).where(Walk.id == walk_id))).scalar_one_or_none()
    if not walk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Walk not found")
    sighting = (await db.execute(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.user_id == current_user.id)
    )).scalar_one_or_none()
    if not sighting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")
    link = WalkSighting(walk_id=walk_id, sighting_id=sighting_id)
    db.add(link)
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        existing = (await db.execute(
            select(WalkSighting).where(
                WalkSighting.walk_id == walk_id,
                WalkSighting.sighting_id == sighting_id,
            )
        )).scalar_one_or_none()
        if existing:
            return existing
        raise
    await db.refresh(link)
    return link


@router.post("/{walk_id}/complete", response_model=WalkCompletionResponse, status_code=status.HTTP_201_CREATED)
async def complete_walk(
    walk_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    walk = (await db.execute(select(Walk).where(Walk.id == walk_id))).scalar_one_or_none()
    if not walk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Walk not found")
    existing = (await db.execute(
        select(WalkCompletion).where(
            WalkCompletion.user_id == current_user.id,
            WalkCompletion.walk_id == walk_id,
        )
    )).scalar_one_or_none()
    if existing:
        return existing
    completion = WalkCompletion(user_id=current_user.id, walk_id=walk_id)
    db.add(completion)
    await db.commit()
    await db.refresh(completion)
    return completion


@router.get("/{walk_id}/reviews", response_model=list[WalkReviewResponse])
async def list_walk_reviews(
    walk_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(WalkReview)
        .where(WalkReview.walk_id == walk_id)
        .order_by(WalkReview.created_at.desc())
    )).scalars().all()
    return rows


@router.post("/{walk_id}/reviews", response_model=WalkReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_walk_review(
    walk_id: int,
    body: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    walk = (await db.execute(select(Walk).where(Walk.id == walk_id))).scalar_one_or_none()
    if not walk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Walk not found")
    existing = (await db.execute(
        select(WalkReview).where(
            WalkReview.user_id == current_user.id,
            WalkReview.walk_id == walk_id,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already reviewed this walk")
    review = WalkReview(user_id=current_user.id, walk_id=walk_id, **body.model_dump())
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.patch("/{walk_id}/reviews/{review_id}", response_model=WalkReviewResponse)
async def update_walk_review(
    walk_id: int,
    review_id: int,
    body: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    review = (await db.execute(
        select(WalkReview).where(
            WalkReview.id == review_id,
            WalkReview.walk_id == walk_id,
        )
    )).scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review
