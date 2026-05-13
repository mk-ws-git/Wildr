from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.location import Location
from app.schemas.location import LocationCreate, LocationUpdate, LocationResponse
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
    await db.commit()
    await db.refresh(location)
    return location


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