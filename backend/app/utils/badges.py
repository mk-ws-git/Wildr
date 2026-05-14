from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.sighting import Sighting
from app.models.user_species import UserSpecies
from app.models.species import Species
from app.models.badge import Badge
from app.models.user_badge import UserBadge


async def award_badges(user_id: int, db: AsyncSession) -> list[str]:
    # Gather stats
    sightings_count = (await db.execute(
        select(func.count()).where(Sighting.user_id == user_id)
    )).scalar_one()

    species_count = (await db.execute(
        select(func.count()).where(UserSpecies.user_id == user_id)
    )).scalar_one()

    def kingdom_count_query(kingdom: str):
        return (
            select(func.count())
            .select_from(UserSpecies)
            .join(Species, UserSpecies.species_id == Species.id)
            .where(UserSpecies.user_id == user_id, Species.kingdom == kingdom)
        )

    bird_count = (await db.execute(kingdom_count_query("bird"))).scalar_one()
    plant_count = (await db.execute(kingdom_count_query("plant"))).scalar_one()
    fungi_count = (await db.execute(kingdom_count_query("fungi"))).scalar_one()

    rare_count = (await db.execute(
        select(func.count())
        .select_from(UserSpecies)
        .join(Species, UserSpecies.species_id == Species.id)
        .where(
            UserSpecies.user_id == user_id,
            Species.rarity_tier.in_(["rare", "very_rare"]),
        )
    )).scalar_one()

    very_rare_count = (await db.execute(
        select(func.count())
        .select_from(UserSpecies)
        .join(Species, UserSpecies.species_id == Species.id)
        .where(UserSpecies.user_id == user_id, Species.rarity_tier == "very_rare")
    )).scalar_one()

    endangered_count = (await db.execute(
        select(func.count())
        .select_from(UserSpecies)
        .join(Species, UserSpecies.species_id == Species.id)
        .where(
            UserSpecies.user_id == user_id,
            Species.conservation_status.in_(["endangered", "critically_endangered"]),
        )
    )).scalar_one()

    # Badge criteria map: name -> whether earned
    criteria = {
        "First Find":     sightings_count >= 1,
        "Naturalist":     sightings_count >= 10,
        "Field Expert":   sightings_count >= 50,
        "Curious Mind":   species_count >= 5,
        "Species Hunter": species_count >= 25,
        "Encyclopaedia":  species_count >= 50,
        "Birder":         bird_count >= 10,
        "Botanist":       plant_count >= 10,
        "Fungi Finder":   fungi_count >= 5,
        "Lucky Find":     rare_count >= 1,
        "Rare Spotter":   very_rare_count >= 3,
        "Guardian":       endangered_count >= 1,
    }

    earned_names = [name for name, met in criteria.items() if met]
    if not earned_names:
        return []

    # Fetch badge IDs for earned badges
    badges_result = await db.execute(
        select(Badge).where(Badge.name.in_(earned_names))
    )
    badges = badges_result.scalars().all()

    # Fetch already-awarded badge IDs
    existing_result = await db.execute(
        select(UserBadge.badge_id).where(UserBadge.user_id == user_id)
    )
    already_awarded = {row for row in existing_result.scalars().all()}

    # Award new badges
    newly_awarded = []
    for badge in badges:
        if badge.id not in already_awarded:
            db.add(UserBadge(user_id=user_id, badge_id=badge.id))
            newly_awarded.append(badge.name)

    if newly_awarded:
        await db.flush()

    return newly_awarded