from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.sighting import Sighting
from app.models.user_species import UserSpecies
from app.models.species import Species
from app.models.badge import Badge
from app.models.user_badge import UserBadge


async def award_badges(user_id: int, db: AsyncSession) -> list[str]:
    # --- Gather stats ---

    sightings_count = (await db.execute(
        select(func.count()).where(Sighting.user_id == user_id)
    )).scalar_one()

    species_count = (await db.execute(
        select(func.count()).where(UserSpecies.user_id == user_id)
    )).scalar_one()

    def kingdom_q(kingdom: str):
        return (
            select(func.count())
            .select_from(UserSpecies)
            .join(Species, UserSpecies.species_id == Species.id)
            .where(UserSpecies.user_id == user_id, Species.kingdom == kingdom)
        )

    bird_count      = (await db.execute(kingdom_q("bird"))).scalar_one()
    plant_count     = (await db.execute(kingdom_q("plant"))).scalar_one()
    fungi_count     = (await db.execute(kingdom_q("fungi"))).scalar_one()
    insect_count    = (await db.execute(kingdom_q("insect"))).scalar_one()
    mammal_count    = (await db.execute(kingdom_q("mammal"))).scalar_one()
    reptile_count   = (await db.execute(kingdom_q("reptile"))).scalar_one()
    amphibian_count = (await db.execute(kingdom_q("amphibian"))).scalar_one()
    fish_count      = (await db.execute(kingdom_q("fish"))).scalar_one()

    uncommon_count = (await db.execute(
        select(func.count())
        .select_from(UserSpecies)
        .join(Species, UserSpecies.species_id == Species.id)
        .where(UserSpecies.user_id == user_id, Species.rarity_tier == "uncommon")
    )).scalar_one()

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

    at_risk_count = (await db.execute(
        select(func.count())
        .select_from(UserSpecies)
        .join(Species, UserSpecies.species_id == Species.id)
        .where(
            UserSpecies.user_id == user_id,
            Species.conservation_status.in_(["vulnerable", "endangered", "critically_endangered"]),
        )
    )).scalar_one()

    # --- Badge criteria map: badge name -> whether earned ---
    criteria = {
        # Explorer
        "First Find":          sightings_count >= 1,
        "Naturalist":          sightings_count >= 10,
        "Field Expert":        sightings_count >= 50,
        "Seasoned Observer":   sightings_count >= 100,
        "Wild Century":        sightings_count >= 250,
        "Thousand Sightings":  sightings_count >= 1000,
        # Life list
        "Curious Mind":        species_count >= 5,
        "Species Hunter":      species_count >= 25,
        "Encyclopaedia":       species_count >= 50,
        "Wild Almanac":        species_count >= 100,
        "Living Field Guide":  species_count >= 200,
        # Kingdom: birds
        "Birder":              bird_count >= 10,
        "Master Birder":       bird_count >= 25,
        "Flock Watcher":       bird_count >= 50,
        # Kingdom: plants
        "Botanist":            plant_count >= 10,
        "Plant Doctor":        plant_count >= 25,
        # Kingdom: fungi
        "Fungi Finder":        fungi_count >= 5,
        "Mycelium Master":     fungi_count >= 15,
        # Kingdom: insects
        "Insect Eye":          insect_count >= 5,
        "Entomologist":        insect_count >= 20,
        # Kingdom: mammals
        "Mammal Watch":        mammal_count >= 5,
        "Beast Master":        mammal_count >= 15,
        # Kingdom: reptiles
        "Reptile Spotter":     reptile_count >= 3,
        "Cold Blooded":        reptile_count >= 8,
        # Kingdom: amphibians
        "Puddle Hunter":       amphibian_count >= 3,
        # Kingdom: fish
        "River Reader":        fish_count >= 5,
        # Rarity
        "Uncommon Eye":        uncommon_count >= 5,
        "Lucky Find":          rare_count >= 1,
        "Rarity Chaser":       rare_count >= 5,
        "Rare Spotter":        very_rare_count >= 3,
        "Legendary Find":      very_rare_count >= 5,
        "Ultra Rare":          very_rare_count >= 10,
        # Conservation
        "Guardian":            endangered_count >= 1,
        "Advocate":            endangered_count >= 3,
        "Red List Ranger":     at_risk_count >= 5,
        "Species Sentinel":    at_risk_count >= 10,
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
