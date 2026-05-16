"""
Import endpoints for bulk sighting ingestion.

POST /sightings/import/inat   — import from iNaturalist (any authenticated user)
POST /sightings/import/ebird  — import from eBird CSV   (any authenticated user)
POST /sightings/import/bulk   — import from generic CSV (trusted/admin only)
"""

import asyncio
import csv
import io
import logging
from datetime import datetime, timezone, date

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.database import get_db
from app.models.sighting import Sighting
from app.models.species import Species
from app.models.user import User
from app.models.user_species import UserSpecies
from app.utils.claude_enrich import enrich_species
from app.utils.gbif import get_species_data
from app.utils.inat import get_taxon_photos

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

INAT_OBSERVATIONS_URL = "https://api.inaturalist.org/v1/observations"

KINGDOM_MAP: dict[str, str] = {
    "Plantae": "plant",
    "Fungi": "fungi",
    "Aves": "bird",
    "Insecta": "insect",
    "Mammalia": "mammal",
    "Reptilia": "reptile",
    "Amphibia": "amphibian",
    "Actinopterygii": "fish",
}


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


async def _get_or_create_species(
    db: AsyncSession,
    scientific_name: str,
    common_name: str,
    kingdom: str,
    taxon_id: int | None = None,
) -> Species:
    """Return an existing Species row or create a new one, enriched via parallel API calls."""
    result = await db.execute(
        select(Species).where(
            func.lower(Species.scientific_name) == scientific_name.lower()
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    # Fetch enrichment data in parallel
    enrich_data, gbif_data, photos = await asyncio.gather(
        enrich_species(common_name, scientific_name),
        get_species_data(scientific_name),
        get_taxon_photos(scientific_name, taxon_id),
        return_exceptions=True,
    )

    if isinstance(enrich_data, Exception):
        logger.warning("enrich_species failed for %s: %s", scientific_name, enrich_data)
        enrich_data = {}
    if isinstance(gbif_data, Exception):
        logger.warning("get_species_data failed for %s: %s", scientific_name, gbif_data)
        gbif_data = {}
    if isinstance(photos, Exception):
        logger.warning("get_taxon_photos failed for %s: %s", scientific_name, photos)
        photos = []

    species = Species(
        common_name=common_name,
        scientific_name=scientific_name,
        kingdom=kingdom,
        rarity_tier=gbif_data.get("rarity_tier"),
        conservation_status=gbif_data.get("conservation_status"),
        fun_fact=enrich_data.get("fun_fact"),
        habitat=enrich_data.get("habitat"),
        behaviour=enrich_data.get("behaviour"),
        seasonal_note=enrich_data.get("seasonal_note"),
        photos=photos if photos else [],
    )
    db.add(species)
    await db.flush()  # get species.id without committing
    return species


async def _upsert_user_species(db: AsyncSession, user_id: int, species_id: int) -> None:
    """Add species to user's life list, inserting or updating as needed."""
    result = await db.execute(
        select(UserSpecies).where(
            UserSpecies.user_id == user_id,
            UserSpecies.species_id == species_id,
        )
    )
    us = result.scalar_one_or_none()
    if us:
        if not us.added_to_list:
            us.added_to_list = True
            db.add(us)
    else:
        db.add(UserSpecies(user_id=user_id, species_id=species_id, added_to_list=True))


async def _duplicate_exists(
    db: AsyncSession, user_id: int, species_id: int, observed_date: date
) -> bool:
    """Return True if the user already has a sighting of this species on this date."""
    result = await db.execute(
        select(Sighting).where(
            Sighting.user_id == user_id,
            Sighting.species_id == species_id,
            func.date(Sighting.identified_at) == observed_date,
        )
    )
    return result.scalar_one_or_none() is not None


# ---------------------------------------------------------------------------
# Endpoint 1 — iNaturalist import
# ---------------------------------------------------------------------------


class InatImportBody(BaseModel):
    inat_username: str


@router.post("/sightings/import/inat", response_model=ImportResult, status_code=status.HTTP_200_OK)
async def import_from_inat(
    body: InatImportBody,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImportResult:
    """Import research-grade iNaturalist observations for a given username."""
    if getattr(current_user, "role", "user") not in ("trusted", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Import requires trusted or admin role")

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(
            INAT_OBSERVATIONS_URL,
            params={
                "user_login": body.inat_username,
                "quality_grade": "research",
                "per_page": 200,
                "order": "desc",
                "order_by": "observed_on",
            },
            headers={"User-Agent": "Wildr/1.0"},
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"iNaturalist API returned {resp.status_code}",
            )
        observations = resp.json().get("results", [])

    imported = 0
    skipped = 0
    errors: list[str] = []

    for obs in observations:
        try:
            taxon = obs.get("taxon") or {}
            scientific_name = taxon.get("name", "").strip()
            common_name = (taxon.get("preferred_common_name") or scientific_name).strip()

            if not scientific_name:
                skipped += 1
                continue

            iconic_taxon = taxon.get("iconic_taxon_name", "")
            kingdom = KINGDOM_MAP.get(iconic_taxon, "other")
            taxon_id: int | None = taxon.get("id")

            # Parse observed_on date
            observed_on_str = obs.get("observed_on") or obs.get("observed_on_string", "")
            if not observed_on_str:
                skipped += 1
                continue
            try:
                observed_date = date.fromisoformat(observed_on_str[:10])
            except ValueError:
                skipped += 1
                errors.append(f"Could not parse date '{observed_on_str}' for {scientific_name}")
                continue

            identified_at = datetime(
                observed_date.year,
                observed_date.month,
                observed_date.day,
                tzinfo=timezone.utc,
            )

            # Lat/lng from "lat,lng" string
            location_str = obs.get("location") or ""
            lat: float | None = None
            lng: float | None = None
            if location_str and "," in location_str:
                parts = location_str.split(",", 1)
                try:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())
                except ValueError:
                    pass

            # Photo URL
            obs_photos = obs.get("photos") or []
            photo_url: str | None = obs_photos[0].get("url") if obs_photos else None

            # Resolve species (create if needed)
            species = await _get_or_create_species(
                db, scientific_name, common_name, kingdom, taxon_id
            )

            # Duplicate check
            if await _duplicate_exists(db, current_user.id, species.id, observed_date):
                skipped += 1
                continue

            # Create sighting
            point = f"SRID=4326;POINT({lng} {lat})" if lat is not None and lng is not None else None
            sighting = Sighting(
                user_id=current_user.id,
                species_id=species.id,
                location=point,
                photo_url=photo_url,
                identified_at=identified_at,
            )
            db.add(sighting)
            await db.flush()

            await _upsert_user_species(db, current_user.id, species.id)

            await db.commit()
            imported += 1

        except Exception as exc:
            await db.rollback()
            sci = (obs.get("taxon") or {}).get("name", "<unknown>")
            logger.error("iNat import error for %s: %s", sci, exc)
            errors.append(f"{sci}: {exc}")
            skipped += 1

    return ImportResult(imported=imported, skipped=skipped, errors=errors)


# ---------------------------------------------------------------------------
# Endpoint 2 — eBird CSV import
# ---------------------------------------------------------------------------


@router.post("/sightings/import/ebird", response_model=ImportResult, status_code=status.HTTP_200_OK)
async def import_from_ebird(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImportResult:
    """Import sightings from an eBird observation CSV export."""
    if getattr(current_user, "role", "user") not in ("trusted", "admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Import requires trusted or admin role")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # strip BOM if present
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    skipped = 0
    errors: list[str] = []

    for row_num, row in enumerate(reader, start=2):  # row 1 = header
        try:
            scientific_name = (row.get("Scientific Name") or "").strip()
            common_name = (row.get("Common Name") or scientific_name).strip()
            date_str = (row.get("Date") or "").strip()
            lat_str = (row.get("Latitude") or "").strip()
            lng_str = (row.get("Longitude") or "").strip()
            place_name = (row.get("Location") or "").strip() or None
            notes = (row.get("Species Comments") or "").strip() or None

            if not scientific_name:
                skipped += 1
                continue

            if not date_str:
                skipped += 1
                errors.append(f"Row {row_num} ({scientific_name}): missing Date")
                continue

            try:
                observed_date = date.fromisoformat(date_str[:10])
            except ValueError:
                skipped += 1
                errors.append(f"Row {row_num} ({scientific_name}): invalid date '{date_str}'")
                continue

            identified_at = datetime(
                observed_date.year,
                observed_date.month,
                observed_date.day,
                tzinfo=timezone.utc,
            )

            lat: float | None = None
            lng: float | None = None
            try:
                if lat_str:
                    lat = float(lat_str)
                if lng_str:
                    lng = float(lng_str)
            except ValueError:
                pass

            # eBird is primarily birds; default kingdom to 'bird'
            kingdom = "bird"

            species = await _get_or_create_species(
                db, scientific_name, common_name, kingdom, taxon_id=None
            )

            if await _duplicate_exists(db, current_user.id, species.id, observed_date):
                skipped += 1
                continue

            point = f"SRID=4326;POINT({lng} {lat})" if lat is not None and lng is not None else None
            sighting = Sighting(
                user_id=current_user.id,
                species_id=species.id,
                location=point,
                place_name=place_name,
                notes=notes,
                identified_at=identified_at,
            )
            db.add(sighting)
            await db.flush()

            await _upsert_user_species(db, current_user.id, species.id)

            await db.commit()
            imported += 1

        except Exception as exc:
            await db.rollback()
            sci = (row.get("Scientific Name") or f"row {row_num}")
            logger.error("eBird import error for %s: %s", sci, exc)
            errors.append(f"{sci}: {exc}")
            skipped += 1

    return ImportResult(imported=imported, skipped=skipped, errors=errors)


# ---------------------------------------------------------------------------
# Endpoint 3 — Bulk CSV import (trusted / admin only)
# ---------------------------------------------------------------------------


@router.post("/sightings/import/bulk", response_model=ImportResult, status_code=status.HTTP_200_OK)
async def import_bulk(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImportResult:
    """
    Import sightings from a generic CSV (trusted/admin users only).

    Required columns: date, species_name
    Optional columns: lat, lng, place_name, notes
    """

    if current_user.role not in ("trusted", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bulk import requires trusted or admin role",
        )

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    skipped = 0
    errors: list[str] = []

    for row_num, row in enumerate(reader, start=2):
        try:
            species_name = (row.get("species_name") or "").strip()
            date_str = (row.get("date") or "").strip()
            lat_str = (row.get("lat") or "").strip()
            lng_str = (row.get("lng") or "").strip()
            place_name = (row.get("place_name") or "").strip() or None
            notes = (row.get("notes") or "").strip() or None

            if not species_name:
                skipped += 1
                errors.append(f"Row {row_num}: missing species_name")
                continue

            if not date_str:
                skipped += 1
                errors.append(f"Row {row_num} ({species_name}): missing date")
                continue

            try:
                observed_date = date.fromisoformat(date_str[:10])
            except ValueError:
                skipped += 1
                errors.append(f"Row {row_num} ({species_name}): invalid date '{date_str}'")
                continue

            identified_at = datetime(
                observed_date.year,
                observed_date.month,
                observed_date.day,
                tzinfo=timezone.utc,
            )

            lat: float | None = None
            lng: float | None = None
            try:
                if lat_str:
                    lat = float(lat_str)
                if lng_str:
                    lng = float(lng_str)
            except ValueError:
                pass

            # Look up species by common_name OR scientific_name (case-insensitive)
            result = await db.execute(
                select(Species).where(
                    (func.lower(Species.common_name) == species_name.lower())
                    | (func.lower(Species.scientific_name) == species_name.lower())
                )
            )
            species = result.scalar_one_or_none()

            if species is None:
                skipped += 1
                errors.append(f"Species not found: {species_name}")
                continue

            if await _duplicate_exists(db, current_user.id, species.id, observed_date):
                skipped += 1
                continue

            point = f"SRID=4326;POINT({lng} {lat})" if lat is not None and lng is not None else None
            sighting = Sighting(
                user_id=current_user.id,
                species_id=species.id,
                location=point,
                place_name=place_name,
                notes=notes,
                identified_at=identified_at,
            )
            db.add(sighting)
            await db.flush()

            await _upsert_user_species(db, current_user.id, species.id)

            await db.commit()
            imported += 1

        except Exception as exc:
            await db.rollback()
            label = row.get("species_name") or f"row {row_num}"
            logger.error("Bulk import error for %s: %s", label, exc)
            errors.append(f"{label}: {exc}")
            skipped += 1

    return ImportResult(imported=imported, skipped=skipped, errors=errors)
