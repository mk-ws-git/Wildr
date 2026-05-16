import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.user_species import UserSpecies
from app.models.species import Species
from app.schemas.user import UserPasswordChange, UserResponse, UserUpdate
from app.schemas.species import SpeciesResponse, UserSpeciesResponse
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password
from app.database import get_db
from app.utils.r2 import upload_file

router = APIRouter()

@router.get("/search", response_model=list[UserResponse])
async def search_users(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(User)
        .where(User.username.ilike(f"%{q}%"), User.id != current_user.id)
        .limit(20)
    )
    return result.scalars().all()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updates = body.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(current_user, field, value)
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    data = await file.read()
    ext = (file.filename or "avatar.jpg").rsplit(".", 1)[-1].lower()
    mime = "image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}"
    key = f"avatars/{current_user.id}/{uuid.uuid4()}.{ext}"
    url = await upload_file(data, key, mime)
    current_user.avatar_url = url
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: UserPasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Password must be at least 8 characters")
    current_user.hashed_password = hash_password(body.new_password)
    db.add(current_user)
    await db.commit()


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await db.delete(current_user)
    await db.commit()


@router.get("/me/species", response_model=list[UserSpeciesResponse])
async def my_life_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = (await db.execute(
        select(UserSpecies, Species)
        .join(Species, Species.id == UserSpecies.species_id)
        .where(UserSpecies.user_id == current_user.id, UserSpecies.added_to_list == True)
        .order_by(UserSpecies.first_seen_at.desc())
    )).all()
    return [
        UserSpeciesResponse(
            **SpeciesResponse.model_validate(species).model_dump(),
            first_seen_at=us.first_seen_at,
            added_to_list=us.added_to_list,
        )
        for us, species in rows
    ]


@router.post("/me/species/{species_id}", response_model=UserSpeciesResponse, status_code=status.HTTP_201_CREATED)
async def add_to_life_list(
    species_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    species = (await db.execute(select(Species).where(Species.id == species_id))).scalar_one_or_none()
    if not species:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Species not found")
    existing = (await db.execute(
        select(UserSpecies).where(
            UserSpecies.user_id == current_user.id,
            UserSpecies.species_id == species_id,
        )
    )).scalar_one_or_none()
    if existing:
        if not existing.added_to_list:
            existing.added_to_list = True
            db.add(existing)
            await db.commit()
            await db.refresh(existing)
        return UserSpeciesResponse(
            **SpeciesResponse.model_validate(species).model_dump(),
            first_seen_at=existing.first_seen_at,
            added_to_list=existing.added_to_list,
        )
    us = UserSpecies(user_id=current_user.id, species_id=species_id, added_to_list=True)
    db.add(us)
    await db.commit()
    await db.refresh(us)
    return UserSpeciesResponse(
        **SpeciesResponse.model_validate(species).model_dump(),
        first_seen_at=us.first_seen_at,
        added_to_list=us.added_to_list,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
