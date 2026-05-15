from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.species import Species
from app.models.species_save import SpeciesSave
from app.models.user_species import UserSpecies
from app.models.sighting import Sighting
from app.schemas.species import SpeciesResponse, SpeciesListItem, UserSpeciesResponse
from app.schemas.sighting import SightingResponse
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db

router = APIRouter()


async def _saved_seen_sets(db: AsyncSession, user_id: int) -> tuple[set, set]:
    saved = (await db.execute(
        select(SpeciesSave.species_id).where(SpeciesSave.user_id == user_id)
    )).scalars().all()
    seen = (await db.execute(
        select(UserSpecies.species_id).where(UserSpecies.user_id == user_id)
    )).scalars().all()
    return set(saved), set(seen)


@router.get("", response_model=list[SpeciesListItem])
async def list_species(
    kingdom: str | None = Query(None),
    rarity: str | None = Query(None),
    conservation_status: str | None = Query(None),
    search: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = select(Species).order_by(Species.common_name)
    if kingdom:
        q = q.where(Species.kingdom == kingdom)
    if rarity:
        q = q.where(Species.rarity_tier == rarity)
    if conservation_status:
        q = q.where(Species.conservation_status == conservation_status)
    if search:
        term = f"%{search}%"
        q = q.where(or_(
            Species.common_name.ilike(term),
            Species.scientific_name.ilike(term),
        ))
    rows = (await db.execute(q)).scalars().all()
    saved_ids, seen_ids = await _saved_seen_sets(db, current_user.id)
    return [
        SpeciesListItem(
            **SpeciesResponse.model_validate(s).model_dump(),
            saved=s.id in saved_ids,
            seen=s.id in seen_ids,
        )
        for s in rows
    ]


@router.get("/saved", response_model=list[SpeciesListItem])
async def saved_species(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Species)
        .join(SpeciesSave, SpeciesSave.species_id == Species.id)
        .where(SpeciesSave.user_id == current_user.id)
        .order_by(Species.common_name)
    )).scalars().all()
    seen_ids = set((await db.execute(
        select(UserSpecies.species_id).where(UserSpecies.user_id == current_user.id)
    )).scalars().all())
    return [
        SpeciesListItem(
            **SpeciesResponse.model_validate(s).model_dump(),
            saved=True,
            seen=s.id in seen_ids,
        )
        for s in rows
    ]


@router.get("/{species_id}", response_model=SpeciesListItem)
async def get_species(
    species_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    s = (await db.execute(select(Species).where(Species.id == species_id))).scalar_one_or_none()
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Species not found")
    saved_ids, seen_ids = await _saved_seen_sets(db, current_user.id)
    return SpeciesListItem(
        **SpeciesResponse.model_validate(s).model_dump(),
        saved=s.id in saved_ids,
        seen=s.id in seen_ids,
    )


@router.post("/{species_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def save_species(
    species_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.add(SpeciesSave(user_id=current_user.id, species_id=species_id))
    try:
        await db.commit()
    except Exception:
        await db.rollback()


@router.delete("/{species_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_species(
    species_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (await db.execute(
        select(SpeciesSave).where(
            SpeciesSave.user_id == current_user.id,
            SpeciesSave.species_id == species_id,
        )
    )).scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()


@router.get("/{species_id}/sightings", response_model=list[SightingResponse])
async def species_sightings(
    species_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = (await db.execute(
        select(Sighting)
        .where(Sighting.species_id == species_id, Sighting.is_private == False)
        .order_by(Sighting.identified_at.desc())
        .limit(20)
    )).scalars().all()
    return rows
