from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.location import Location
from app.models.location_save import LocationSave
from app.models.user_location import UserLocation
from app.models.sighting import Sighting
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
from app.schemas.sighting import SightingResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db

router = APIRouter()


@router.get("", response_model=list[LocationResponse])
async def list_locations(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Location).order_by(Location.name))
    return result.scalars().all()


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    return location


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    body: LocationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    location = Location(
        name=body.name,
        type=body.type,
        centre_point=f"SRID=4326;POINT({body.lng} {body.lat})",
        radius_metres=body.radius_metres,
        source="user",
        created_by=current_user.id,
    )
    db.add(location)
    await db.flush()
    db.add(LocationSave(user_id=current_user.id, location_id=location.id))
    await db.commit()
    await db.refresh(location)
    return location


@router.get("/saved", response_model=list[LocationResponse])
async def my_saved_locations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    saved_result = await db.execute(
        select(Location)
        .join(LocationSave, LocationSave.location_id == Location.id)
        .where(LocationSave.user_id == current_user.id)
        .order_by(Location.name)
    )
    saved_locations = saved_result.scalars().all()

    visited_result = await db.execute(
        select(UserLocation.location_id)
        .where(
            UserLocation.user_id == current_user.id,
            UserLocation.visit_count > 0,
        )
    )
    visited_ids = {row[0] for row in visited_result.all()}

    return [
        {
            **LocationResponse.model_validate(location).model_dump(),
            "visited": location.id in visited_ids,
        }
        for location in saved_locations
    ]


@router.get("/{location_id}/sightings", response_model=list[SightingResponse])
async def location_sightings(
    location_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Sighting)
        .where(Sighting.location_id == location_id, Sighting.is_private == False)
        .order_by(Sighting.identified_at.desc())
        .limit(50)
    )).scalars().all()
    return rows


@router.post("/{location_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def save_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    location = (await db.execute(select(Location).where(Location.id == location_id))).scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    db.add(LocationSave(user_id=current_user.id, location_id=location_id))
    try:
        await db.commit()
    except Exception:
        await db.rollback()


@router.post("/{location_id}/visit", status_code=status.HTTP_204_NO_CONTENT)
async def mark_visited(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    location = (await db.execute(select(Location).where(Location.id == location_id))).scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    now = datetime.now(timezone.utc)
    stmt = (
        pg_insert(UserLocation)
        .values(user_id=current_user.id, location_id=location_id, visit_count=1,
                first_visited=now, last_visited=now)
        .on_conflict_do_update(
            index_elements=["user_id", "location_id"],
            set_={"visit_count": UserLocation.visit_count + 1, "last_visited": now},
        )
    )
    await db.execute(stmt)
    # auto-save if not already saved
    db.add(LocationSave(user_id=current_user.id, location_id=location_id))
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        await db.commit()


@router.delete("/{location_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_location(
    location_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = (await db.execute(
        select(LocationSave).where(
            LocationSave.user_id == current_user.id,
            LocationSave.location_id == location_id,
        )
    )).scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()


@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    body: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    if location.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your location")

    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(location, field, value)
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location