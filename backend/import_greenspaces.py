"""
One-time import script: streams germany-greenspaces.geojson into the
wildr PostgreSQL greenspaces table. Filters out anything under 500sqm.
Run from backend/ with the venv active:
  python import_greenspaces.py
"""

import ijson
import json
import os
from decimal import Decimal
import psycopg2
from dotenv import load_dotenv


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)

load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

DATABASE_URL = "postgresql://postgres:2026!wildrdev@db.gsstcquplvnfrmerntsc.supabase.co:5432/postgres"

GEOJSON_PATH = "/Volumes/MK HD/germany-greenspaces.geojson"
BATCH_SIZE = 500
MIN_AREA_SQM = 500

# Berlin bounding box — swap for full Germany on real deployment
BERLIN_MIN_LAT, BERLIN_MAX_LAT = 52.3382, 52.6755
BERLIN_MIN_LNG, BERLIN_MAX_LNG = 13.0883, 13.7612


def in_berlin(geom: dict) -> bool:
    def check(c):
        if isinstance(c[0], (int, float, Decimal)):
            lng, lat = float(c[0]), float(c[1])
            return BERLIN_MIN_LNG <= lng <= BERLIN_MAX_LNG and BERLIN_MIN_LAT <= lat <= BERLIN_MAX_LAT
        return any(check(sub) for sub in c)
    return check(geom.get("coordinates", []))

# Only include these leisure/landuse/boundary values — exclude parking, water, pitches etc.
VALID_TYPES = {
    "leisure": {"park", "nature_reserve", "garden", "recreation_ground"},
    "landuse": {"forest", "grass", "meadow", "greenfield"},
    "boundary": {"national_park", "protected_area"},
}

# Tags that disqualify a feature even if it has a greenspace tag
EXCLUDE_AMENITY = {"parking", "school", "hospital"}
EXCLUDE_LEISURE = {"pitch", "sports_centre", "swimming_pool", "stadium"}


def get_type(props: dict) -> str | None:
    """Return greenspace type or None if this feature should be excluded."""
    if props.get("amenity") in EXCLUDE_AMENITY:
        return None
    if props.get("leisure") in EXCLUDE_LEISURE:
        return None
    for key, valid in VALID_TYPES.items():
        val = props.get(key)
        if val and val in valid:
            return val
    return None


def insert_batch(cur, batch: list):
    cur.executemany(
        """
        INSERT INTO greenspaces (osm_id, name, type, geometry, centre_point, area_sqm)
        SELECT
            %(osm_id)s,
            %(name)s,
            %(type)s,
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

            if not in_berlin(geom):
                skipped += 1
                continue

            gs_type = get_type(props)
            if not gs_type:
                skipped += 1
                continue

            batch.append({
                "osm_id": counter,
                "name": props.get("name"),
                "type": gs_type,
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
    print(f"\nDone. Inserted up to {total} features ({skipped} skipped).")
    print("Run: SELECT COUNT(*) FROM greenspaces; to verify.")


if __name__ == "__main__":
    main()
