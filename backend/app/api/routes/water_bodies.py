from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.database import get_db
from app.core.deps import get_current_user
from app.models.water_body import WaterBody
from app.schemas.water_body import WaterBodyPin, WaterBodySummary
from app.utils.wikipedia import get_place_summary

router = APIRouter(prefix="/water-bodies", tags=["water-bodies"])


@router.get("/nearby", response_model=list[WaterBodyPin])
async def nearby_water_bodies(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: int = Query(2000, le=10000),
    limit: int = Query(50, le=200),
    swimming_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    swimming_filter = "AND is_swimming_spot = TRUE" if swimming_only else ""
    result = await db.execute(
        text(f"""
            SELECT
                id, name, type, water_subtype, is_swimming_spot, area_sqm,
                ST_Y(centre_point::geometry) AS lat,
                ST_X(centre_point::geometry) AS lng
            FROM water_bodies
            WHERE ST_DWithin(
                centre_point,
                ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
                :radius
            )
            {swimming_filter}
            ORDER BY area_sqm DESC NULLS LAST
            LIMIT :limit
        """),
        {"lat": lat, "lng": lng, "radius": radius_m, "limit": limit},
    )
    rows = result.mappings().all()
    return [WaterBodyPin(**dict(r)) for r in rows]


@router.get("/{water_body_id}/summary", response_model=WaterBodySummary)
async def water_body_summary(
    water_body_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(
        select(WaterBody).where(WaterBody.id == water_body_id)
    )
    wb = result.scalar_one_or_none()
    if not wb:
        raise HTTPException(404, "Water body not found")

    radius = wb.area_sqm ** 0.5 if wb.area_sqm else 500

    # Recent sightings near this water body
    sightings_result = await db.execute(
        text("""
            SELECT s.id, s.photo_url, s.identified_at,
                   sp.common_name, sp.rarity_tier
            FROM sightings s
            JOIN species sp ON s.species_id = sp.id
            JOIN water_bodies wb ON wb.id = :wb_id
            WHERE ST_DWithin(s.location, wb.centre_point, :radius)
            AND s.is_private = FALSE
            ORDER BY s.identified_at DESC
            LIMIT 5
        """),
        {"wb_id": water_body_id, "radius": radius},
    )
    recent_sightings = [dict(r) for r in sightings_result.mappings().all()]

    # Species count
    species_result = await db.execute(
        text("""
            SELECT COUNT(DISTINCT s.species_id)
            FROM sightings s
            JOIN water_bodies wb ON wb.id = :wb_id
            WHERE ST_DWithin(s.location, wb.centre_point, :radius)
            AND s.is_private = FALSE
        """),
        {"wb_id": water_body_id, "radius": radius},
    )
    species_count = species_result.scalar_one() or 0

    summary, source = await get_place_summary(wb.name, wb.water_subtype or wb.type)

    return WaterBodySummary(
        id=wb.id,
        name=wb.name,
        type=wb.type,
        water_subtype=wb.water_subtype,
        is_swimming_spot=wb.is_swimming_spot,
        area_sqm=wb.area_sqm,
        summary=summary,
        summary_source=source,
        recent_sightings=recent_sightings,
        species_count=species_count,
    )
