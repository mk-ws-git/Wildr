from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.sighting import Sighting
from app.models.species import Species
from app.models.friendship import Friendship
from app.schemas.sighting import SightingWithSpecies
from app.core.deps import get_current_user
from app.models.user import User
from app.database import get_db

router = APIRouter()


@router.get("/feed", response_model=list[SightingWithSpecies])
async def get_feed(
    limit: int = Query(default=30, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    friend_ids_result = await db.execute(
        select(
            Friendship.requester_id,
            Friendship.addressee_id,
        ).where(
            Friendship.status == "accepted",
            or_(
                Friendship.requester_id == current_user.id,
                Friendship.addressee_id == current_user.id,
            ),
        )
    )
    friend_ids: set[int] = set()
    for row in friend_ids_result.all():
        other = row.addressee_id if row.requester_id == current_user.id else row.requester_id
        friend_ids.add(other)

    rows = (await db.execute(
        select(Sighting, Species)
        .join(Species, Species.id == Sighting.species_id)
        .where(
            or_(
                Sighting.user_id.in_(friend_ids) if friend_ids else False,
                Sighting.is_private == False,
            )
        )
        .order_by(Sighting.identified_at.desc())
        .offset(offset)
        .limit(limit)
    )).all()

    return [
        SightingWithSpecies(
            **{c.key: getattr(sighting, c.key) for c in Sighting.__table__.columns},
            common_name=species.common_name,
            scientific_name=species.scientific_name,
            kingdom=species.kingdom,
            rarity_tier=species.rarity_tier,
        )
        for sighting, species in rows
    ]
