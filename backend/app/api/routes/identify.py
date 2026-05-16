import asyncio
import io
import uuid
from PIL import Image
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.species import Species
from app.models.sighting import Sighting
from app.models.user_species import UserSpecies
from app.models.location import Location
from app.schemas.species import SpeciesResponse
from app.utils.badges import award_badges
from app.utils.inat import identify_photo, get_taxon_photos
from app.utils.gbif import get_species_data
from app.utils.claude_enrich import enrich_species
from app.utils.r2 import upload_file
from app.utils.claude_audio import analyze_audio_claude as _claude_analyze


async def analyze_audio(audio_bytes: bytes) -> list[dict]:
    if settings.USE_BIRDNET:
        # Lazy import — birdnetlib/TensorFlow only loaded when explicitly enabled
        from app.utils.birdnet import analyze_audio as _birdnet_analyze
        return await _birdnet_analyze(audio_bytes)
    return await _claude_analyze(audio_bytes)
from app.utils.waveform import generate_waveform

router = APIRouter()


async def _validate_location(db: AsyncSession, location_id: int) -> None:
    result = await db.execute(select(Location).where(Location.id == location_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Location not found")


async def _upsert_user_species(db: AsyncSession, user_id: int, species_id: int) -> bool:
    """Add species to the user's life list. Returns True if this is the first time."""
    existing = (await db.execute(
        select(UserSpecies).where(
            UserSpecies.user_id == user_id,
            UserSpecies.species_id == species_id,
        )
    )).scalar_one_or_none()

    if existing:
        if not existing.added_to_list:
            existing.added_to_list = True
            db.add(existing)
        return False  # Not a first sighting

    db.add(UserSpecies(user_id=user_id, species_id=species_id, added_to_list=True))
    return True  # First sighting


KINGDOM_MAP = {
    "Plantae": "plant", "Fungi": "fungi", "Aves": "bird",
    "Insecta": "insect", "Mammalia": "mammal", "Reptilia": "reptile",
    "Amphibia": "amphibian", "Actinopterygii": "fish",
}


@router.post("/photo")
async def identify_photo_route(
    photo: UploadFile = File(...),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
    location_id: int | None = Form(None),
    place_name: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await photo.read()

    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode in ('RGBA', 'P', 'LA', 'CMYK'):
            img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=85)
        image_bytes = buf.getvalue()
    except Exception:
        pass

    if location_id is not None:
        await _validate_location(db, location_id)

    # 1. Upload to R2
    key = f"sightings/{uuid.uuid4()}.jpg"
    photo_url = await upload_file(image_bytes, key, "image/jpeg")

    # 2. iNaturalist Vision
    results = await identify_photo(image_bytes)
    if not results:
        raise HTTPException(status_code=422, detail="Could not identify species from photo")

    top = results[0]
    score = top["score"]
    uncertain = score < 0.85
    suggestions = results[1:4] if uncertain else []

    # 3. Get or create species
    result = await db.execute(
        select(Species).where(Species.scientific_name == top["scientific_name"])
    )
    species = result.scalar_one_or_none()

    if not species:
        # 4. Claude enrichment + GBIF + iNat photos in parallel
        enrichment, gbif, inat_photos = await asyncio.gather(
            enrich_species(top["common_name"], top["scientific_name"]),
            get_species_data(top["scientific_name"]),
            get_taxon_photos(top["scientific_name"], top.get("taxon_id")),
        )
        kingdom = KINGDOM_MAP.get(top["iconic_taxon"], "other")
        species = Species(
            common_name=top["common_name"],
            scientific_name=top["scientific_name"],
            kingdom=kingdom,
            rarity_tier=gbif["rarity_tier"],
            conservation_status=gbif["conservation_status"],
            fun_fact=enrichment.get("fun_fact"),
            habitat=enrichment.get("habitat"),
            behaviour=enrichment.get("behaviour"),
            seasonal_note=enrichment.get("seasonal_note"),
            photos=inat_photos,
        )
        db.add(species)
        await db.flush()

    # 5. Save sighting
    point = f"SRID=4326;POINT({lng} {lat})" if lat and lng else None
    sighting = Sighting(
        user_id=current_user.id,
        species_id=species.id,
        location_id=location_id,
        location=point,
        place_name=place_name,
        photo_url=photo_url,
    )
    db.add(sighting)
    await db.flush()
    first_sighting = await _upsert_user_species(db, current_user.id, species.id)
    new_badges = await award_badges(current_user.id, db)
    await db.commit()
    await db.refresh(species)
    await db.refresh(sighting)

    show_endangered_banner = species.conservation_status in (
        "endangered", "critically_endangered"
    )

    return {
        "sighting_id": sighting.id,
        "species": SpeciesResponse.model_validate(species),
        "score": score,
        "uncertain": uncertain,
        "suggestions": suggestions,
        "show_endangered_banner": show_endangered_banner,
        "first_sighting": first_sighting,
        "new_badges": new_badges,
        "photo_url": photo_url,
    }


@router.post("/audio")
async def identify_audio_route(
    audio: UploadFile = File(...),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
    location_id: int | None = Form(None),
    place_name: str | None = Form(None),
    selected_scientific_name: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read()

    if location_id is not None:
        await _validate_location(db, location_id)

    # 1. Upload to R2
    key = f"sightings/audio/{uuid.uuid4()}.mp3"
    audio_url = await upload_file(audio_bytes, key, "audio/mpeg")

    # 2. Generate waveform
    waveform_data = generate_waveform(audio_bytes)

    # 3. BirdNET analysis
    detections = await analyze_audio(audio_bytes)
    if not detections:
        return {
            "no_result": True,
            "message": "No birds detected — try a longer recording in a quieter environment.",
            "audio_url": audio_url,
            "waveform_data": waveform_data,
        }

    # If the user manually confirmed a species (low-confidence picker), use that
    top = detections[0]
    if selected_scientific_name:
        matched = next(
            (d for d in detections if d["scientific_name"] == selected_scientific_name),
            None,
        )
        if matched:
            top = matched

    # 4. Get or create species
    result = await db.execute(
        select(Species).where(Species.scientific_name == top["scientific_name"])
    )
    species = result.scalar_one_or_none()

    if not species:
        # 5. Claude enrichment + GBIF + iNat photos in parallel
        enrichment, gbif, inat_photos = await asyncio.gather(
            enrich_species(top["common_name"], top["scientific_name"]),
            get_species_data(top["scientific_name"]),
            get_taxon_photos(top["scientific_name"], top.get("taxon_id")),
        )
        species = Species(
            common_name=top["common_name"],
            scientific_name=top["scientific_name"],
            kingdom="bird",
            rarity_tier=gbif["rarity_tier"],
            conservation_status=gbif["conservation_status"],
            fun_fact=enrichment.get("fun_fact"),
            habitat=enrichment.get("habitat"),
            behaviour=enrichment.get("behaviour"),
            seasonal_note=enrichment.get("seasonal_note"),
            photos=inat_photos,
        )
        db.add(species)
        await db.flush()

    # 6. Save sighting
    point = f"SRID=4326;POINT({lng} {lat})" if lat and lng else None
    sighting = Sighting(
        user_id=current_user.id,
        species_id=species.id,
        location_id=location_id,
        location=point,
        place_name=place_name,
        audio_url=audio_url,
        waveform_data=waveform_data,
    )
    db.add(sighting)
    await db.flush()
    first_sighting = await _upsert_user_species(db, current_user.id, species.id)
    new_badges = await award_badges(current_user.id, db)
    await db.commit()
    await db.refresh(species)
    await db.refresh(sighting)

    show_endangered_banner = species.conservation_status in (
        "endangered", "critically_endangered"
    )

    return {
        "sighting_id": sighting.id,
        "species": SpeciesResponse.model_validate(species),
        "detections": detections,
        "audio_url": audio_url,
        "waveform_data": waveform_data,
        "show_endangered_banner": show_endangered_banner,
        "first_sighting": first_sighting,
        "new_badges": new_badges,
    }