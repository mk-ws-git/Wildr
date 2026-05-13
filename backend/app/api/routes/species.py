from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.species import Species
from app.schemas.species import SpeciesResponse
from app.core.deps import get_current_user
from app.database import get_db

router = APIRouter()


@router.get("", response_model=list[SpeciesResponse])
async def list_species(
    kingdom: str | None = Query(None),
    rarity: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Species)
    if kingdom:
        q = q.where(Species.kingdom == kingdom)
    if rarity:
        q = q.where(Species.rarity_tier == rarity)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{species_id}", response_model=SpeciesResponse)
async def get_species(
    species_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    result = await db.execute(select(Species).where(Species.id == species_id))
    species = result.scalar_one_or_none()
    if not species:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Species not found")
    return species