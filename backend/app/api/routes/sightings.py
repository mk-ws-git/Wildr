from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.sighting import Sighting
from app.schemas.sighting import SightingCreate, SightingResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db

router = APIRouter()


@router.post("", response_model=SightingResponse, status_code=status.HTTP_201_CREATED)
async def create_sighting(
    body: SightingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    point = None
    if body.lat is not None and body.lng is not None:
        point = f"SRID=4326;POINT({body.lng} {body.lat})"

    sighting = Sighting(
        user_id=current_user.id,
        species_id=body.species_id,
        location_id=body.location_id,
        location=point,
        notes=body.notes,
    )
    db.add(sighting)
    await db.commit()
    await db.refresh(sighting)
    return sighting


@router.get("/me", response_model=list[SightingResponse])
async def my_sightings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sighting)
        .where(Sighting.user_id == current_user.id)
        .order_by(Sighting.identified_at.desc())
    )
    return result.scalars().all()


@router.get("/nearby", response_model=list[SightingResponse])
async def nearby_sightings(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: int = Query(1000),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT * FROM sightings
            WHERE ST_DWithin(
                location::geography,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            ORDER BY identified_at DESC
        """),
        {"lat": lat, "lng": lng, "radius": radius_m},
    )
    rows = result.mappings().all()
    return [SightingResponse.model_validate(dict(r)) for r in rows]