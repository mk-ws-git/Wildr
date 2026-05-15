from fastapi import APIRouter
from app.api.routes import health, auth, users, species, sightings, locations, identify, walks, badges, friendships, notifications, greenspaces, water_bodies, weather, photos, invitations

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(species.router, prefix="/species", tags=["species"])
api_router.include_router(sightings.router, prefix="/sightings", tags=["sightings"])
api_router.include_router(locations.router, prefix="/locations", tags=["locations"])
api_router.include_router(identify.router, prefix="/identify", tags=["identify"])
api_router.include_router(walks.router, prefix="/walks", tags=["walks"])
api_router.include_router(badges.router)
api_router.include_router(friendships.router)
api_router.include_router(notifications.router)
api_router.include_router(greenspaces.router)
api_router.include_router(water_bodies.router)
api_router.include_router(weather.router, prefix="/weather", tags=["weather"])
api_router.include_router(photos.router, prefix="/photos", tags=["photos"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["invitations"])