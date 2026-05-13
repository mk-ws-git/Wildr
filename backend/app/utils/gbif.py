import httpx

GBIF_SPECIES_URL = "https://api.gbif.org/v1/species/match"
GBIF_OCCURRENCE_URL = "https://api.gbif.org/v1/occurrence/search"

IUCN_TO_STATUS = {
    "LC": "least_concern",
    "NT": "near_threatened",
    "VU": "vulnerable",
    "EN": "endangered",
    "CR": "critically_endangered",
    "EW": "extinct_in_wild",
    "EX": "extinct",
}


async def get_species_data(scientific_name: str) -> dict:
    async with httpx.AsyncClient(timeout=20) as client:
        match_resp = await client.get(
            GBIF_SPECIES_URL,
            params={"name": scientific_name, "verbose": False},
        )
        match_resp.raise_for_status()
        match = match_resp.json()

        taxon_key = match.get("usageKey")
        iucn_code = match.get("iucnRedListCategory")
        conservation_status = IUCN_TO_STATUS.get(iucn_code)

        rarity_tier = None
        if taxon_key:
            occ_resp = await client.get(
                GBIF_OCCURRENCE_URL,
                params={"taxonKey": taxon_key, "limit": 1},
            )
            occ_resp.raise_for_status()
            count = occ_resp.json().get("count", 0)

            if count >= 10000:
                rarity_tier = "common"
            elif count >= 1000:
                rarity_tier = "uncommon"
            elif count >= 100:
                rarity_tier = "rare"
            else:
                rarity_tier = "very_rare"

    return {
        "rarity_tier": rarity_tier,
        "conservation_status": conservation_status,
    }