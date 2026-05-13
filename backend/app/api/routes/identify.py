import asyncio
import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.species import Species
from app.models.sighting import Sighting
from app.schemas.species import SpeciesResponse
from app.utils.inat import identify_photo
from app.utils.gbif import get_species_data
from app.utils.claude_enrich import enrich_species
from app.utils.r2 import upload_file
from app.utils.birdnet import analyze_audio
from app.utils.waveform import generate_waveform

router = APIRouter()

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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    image_bytes = await photo.read()

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
        # 4. Claude enrichment + GBIF in parallel
        enrichment, gbif = await asyncio.gather(
            enrich_species(top["common_name"], top["scientific_name"]),
            get_species_data(top["scientific_name"]),
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
        photo_url=photo_url,
    )
    db.add(sighting)
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
        "photo_url": photo_url,
    }


@router.post("/audio")
async def identify_audio_route(
    audio: UploadFile = File(...),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
    location_id: int | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read()

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

    top = detections[0]

    # 4. Get or create species
    result = await db.execute(
        select(Species).where(Species.scientific_name == top["scientific_name"])
    )
    species = result.scalar_one_or_none()

    if not species:
        # 5. Claude enrichment + GBIF in parallel
        enrichment, gbif = await asyncio.gather(
            enrich_species(top["common_name"], top["scientific_name"]),
            get_species_data(top["scientific_name"]),
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
        audio_url=audio_url,
        waveform_data=waveform_data,
    )
    db.add(sighting)
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
    }