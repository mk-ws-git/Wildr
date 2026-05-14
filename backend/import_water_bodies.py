"""
One-time import script: streams germany-water.geojson into the
wildr PostgreSQL water_bodies table. Filters out anything under 1000sqm.
Run from backend/ with the venv active:
  python import_water_bodies.py
"""

import ijson
import json
import os
from decimal import Decimal
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

DATABASE_URL = os.getenv("DATABASE_URL", "").replace(
    "postgresql+asyncpg://", "postgresql://"
)

GEOJSON_PATH = "/Volumes/MK HD/germany-water.geojson"
BATCH_SIZE = 500
MIN_AREA_SQM = 1000

VALID_WATER_SUBTYPES = {
    "lake", "pond", "reservoir", "basin", "lagoon", "oxbow"
}

SWIMMING_LEISURE = {"swimming_area"}
SWIMMING_SPORT = {"swimming"}


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def classify(props: dict) -> tuple[str, str, bool]:
    """Returns (type, water_subtype, is_swimming_spot) or None to skip."""
    natural = props.get("natural")
    leisure = props.get("leisure")
    sport = props.get("sport")
    water = props.get("water", "")

    is_swimming = (
        leisure in SWIMMING_LEISURE
        or sport in SWIMMING_SPORT
        or props.get("amenity") == "swimming_area"
    )

    if leisure in SWIMMING_LEISURE:
        return ("swimming_area", water or "unknown", True)

    if natural == "water":
        subtype = water if water in VALID_WATER_SUBTYPES else "other"
        # Exclude rivers/streams — they're better as linestrings
        if water in ("river", "stream", "canal", "drain", "ditch"):
            return None
        return ("water", subtype, is_swimming)

    return None


def insert_batch(cur, batch: list):
    cur.executemany(
        """
        INSERT INTO water_bodies (osm_id, name, type, water_subtype, is_swimming_spot, geometry, centre_point, area_sqm)
        SELECT
            %(osm_id)s,
            %(name)s,
            %(type)s,
            %(water_subtype)s,
            %(is_swimming_spot)s,
            ST_GeomFromGeoJSON(%(geom)s)::geography,
            ST_Centroid(ST_GeomFromGeoJSON(%(geom)s))::geography,
            ST_Area(ST_GeomFromGeoJSON(%(geom)s)::geography)
        WHERE ST_Area(ST_GeomFromGeoJSON(%(geom)s)::geography) >= %(min_area)s
        ON CONFLICT (osm_id) DO NOTHING
        """,
        batch,
    )


def main():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    batch = []
    total = 0
    skipped = 0
    counter = 1

    print(f"Streaming {GEOJSON_PATH} ...")

    with open(GEOJSON_PATH, "rb") as f:
        features = ijson.items(f, "features.item")
        for feature in features:
            props = feature.get("properties") or {}
            geom = feature.get("geometry")

            if not geom or geom.get("type") not in ("Polygon", "MultiPolygon"):
                skipped += 1
                continue

            result = classify(props)
            if not result:
                skipped += 1
                continue

            gs_type, subtype, is_swimming = result

            batch.append({
                "osm_id": counter,
                "name": props.get("name"),
                "type": gs_type,
                "water_subtype": subtype,
                "is_swimming_spot": is_swimming,
                "geom": json.dumps(geom, cls=DecimalEncoder),
                "min_area": MIN_AREA_SQM,
            })
            counter += 1

            if len(batch) >= BATCH_SIZE:
                insert_batch(cur, batch)
                conn.commit()
                total += len(batch)
                batch = []
                print(f"  Inserted {total} so far...")

    if batch:
        insert_batch(cur, batch)
        conn.commit()
        total += len(batch)

    cur.close()
    conn.close()
    print(f"\nDone. Inserted {total} water bodies ({skipped} skipped).")
    print("Run: SELECT COUNT(*), is_swimming_spot FROM water_bodies GROUP BY is_swimming_spot;")


if __name__ == "__main__":
    main()
