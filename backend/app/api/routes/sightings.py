from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.sighting import Sighting
from app.models.species import Species
from app.schemas.sighting import SightingCreate, SightingResponse, SightingUpdate, SightingWithSpecies
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db
from app.services.weather import fetch_weather

router = APIRouter()


@router.post("", response_model=SightingResponse, status_code=status.HTTP_201_CREATED)
async def create_sighting(
    body: SightingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    point = None
    weather = None
    if body.lat is not None and body.lng is not None:
        point = f"SRID=4326;POINT({body.lng} {body.lat})"
        weather = await fetch_weather(body.lat, body.lng)

    sighting = Sighting(
        user_id=current_user.id,
        species_id=body.species_id,
        location_id=body.location_id,
        location=point,
        place_name=body.place_name,
        notes=body.notes,
        weather_temp_c=weather["temp_c"] if weather else None,
        weather_description=weather["description"] if weather else None,
        weather_data=weather,
    )
    db.add(sighting)
    await db.commit()
    await db.refresh(sighting)
    return sighting


@router.get("/me", response_model=list[SightingWithSpecies])
async def my_sightings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    result = await db.execute(
        select(
            Sighting,
            Species.common_name,
            Species.scientific_name,
            Species.kingdom,
            Species.rarity_tier,
        )
        .join(Species, Sighting.species_id == Species.id)
        .where(Sighting.user_id == current_user.id)
        .order_by(Sighting.identified_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()
    return [
        SightingWithSpecies(
            **SightingResponse.model_validate(row.Sighting).model_dump(),
            common_name=row.common_name,
            scientific_name=row.scientific_name,
            kingdom=row.kingdom,
            rarity_tier=row.rarity_tier,
        )
        for row in rows
    ]


@router.get("/user/{user_id}", response_model=list[SightingWithSpecies])
async def user_sightings(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
):
    """Public sightings for any user (non-private only)."""
    result = await db.execute(
        select(
            Sighting,
            Species.common_name,
            Species.scientific_name,
            Species.kingdom,
            Species.rarity_tier,
        )
        .join(Species, Sighting.species_id == Species.id)
        .where(Sighting.user_id == user_id, Sighting.is_private == False)
        .order_by(Sighting.identified_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        SightingWithSpecies(
            **SightingResponse.model_validate(row.Sighting).model_dump(),
            common_name=row.common_name,
            scientific_name=row.scientific_name,
            kingdom=row.kingdom,
            rarity_tier=row.rarity_tier,
        )
        for row in rows
    ]


@router.patch("/me/{sighting_id}", response_model=SightingResponse)
async def update_sighting(
    sighting_id: int,
    body: SightingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.user_id == current_user.id)
    )
    sighting = result.scalar_one_or_none()
    if not sighting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")
    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(sighting, field, value)
    db.add(sighting)
    await db.commit()
    await db.refresh(sighting)
    return sighting


@router.delete("/me/{sighting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sighting(
    sighting_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Sighting).where(Sighting.id == sighting_id, Sighting.user_id == current_user.id)
    )
    sighting = result.scalar_one_or_none()
    if not sighting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sighting not found")
    await db.delete(sighting)
    await db.commit()


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
