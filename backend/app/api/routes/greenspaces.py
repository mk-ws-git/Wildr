from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from app.database import get_db
from app.core.deps import get_current_user
from app.models.greenspace import Greenspace
from app.models.sighting import Sighting
from app.models.species import Species
from app.schemas.greenspace import GreenspacePin, GreenspaceSummary
from app.utils.wikipedia import get_place_summary

router = APIRouter(prefix="/greenspaces", tags=["greenspaces"])


@router.get("/nearby", response_model=list[GreenspacePin])
async def nearby_greenspaces(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: int = Query(2000, le=10000),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        text("""
            SELECT
                id, name, type, area_sqm,
                ST_Y(centre_point::geometry) AS lat,
                ST_X(centre_point::geometry) AS lng,
                ST_AsGeoJSON(geometry) AS geojson
            FROM greenspaces
            WHERE ST_DWithin(
                centre_point,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            AND name IS NOT NULL AND name != ''
            ORDER BY area_sqm DESC NULLS LAST
            LIMIT :limit
        """),
        {"lat": lat, "lng": lng, "radius": radius_m, "limit": limit},
    )
    rows = result.mappings().all()
    return [GreenspacePin(**dict(r)) for r in rows]


@router.get("/{greenspace_id}/summary", response_model=GreenspaceSummary)
async def greenspace_summary(
    greenspace_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(Greenspace).where(Greenspace.id == greenspace_id)
    )
    gs = result.scalar_one_or_none()
    if not gs:
        raise HTTPException(404, "Greenspace not found")

    # Recent sightings near this greenspace's centre point
    sightings_result = await db.execute(
        text("""
            SELECT s.id, s.photo_url, s.identified_at,
                   sp.common_name, sp.rarity_tier
            FROM sightings s
            JOIN species sp ON s.species_id = sp.id
            JOIN greenspaces g ON g.id = :gs_id
            WHERE ST_DWithin(
                s.location,
                g.centre_point,
                :radius
            )
            AND s.is_private = FALSE
            ORDER BY s.identified_at DESC
            LIMIT 5
        """),
        {"gs_id": greenspace_id, "radius": gs.area_sqm ** 0.5 if gs.area_sqm else 500},
    )
    recent_sightings = [dict(r) for r in sightings_result.mappings().all()]

    # Species count
    species_result = await db.execute(
        text("""
            SELECT COUNT(DISTINCT s.species_id)
            FROM sightings s
            JOIN greenspaces g ON g.id = :gs_id
            WHERE ST_DWithin(s.location, g.centre_point, :radius)
            AND s.is_private = FALSE
        """),
        {"gs_id": greenspace_id, "radius": gs.area_sqm ** 0.5 if gs.area_sqm else 500},
    )
    species_count = species_result.scalar_one() or 0

    # Wikipedia / Claude summary
    summary, source = await get_place_summary(gs.name, gs.type)

    return GreenspaceSummary(
        id=gs.id,
        name=gs.name,
        type=gs.type,
        area_sqm=gs.area_sqm,
        summary=summary,
        summary_source=source,
        recent_sightings=recent_sightings,
        species_count=species_count,
    )
