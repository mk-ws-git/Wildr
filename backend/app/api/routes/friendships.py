from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from app.database import get_db
from app.core.deps import get_current_user
from app.models.friendship import Friendship
from app.schemas.friendship import FriendshipRequest, FriendshipAction, FriendshipResponse

router = APIRouter(prefix="/friendships", tags=["friendships"])

@router.post("", response_model=FriendshipResponse, status_code=201)
async def send_request(
    body: FriendshipRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.addressee_id == current_user.id:
        raise HTTPException(400, "Cannot friend yourself")

    existing = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.requester_id == current_user.id, Friendship.addressee_id == body.addressee_id),
                and_(Friendship.requester_id == body.addressee_id, Friendship.addressee_id == current_user.id),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Friendship already exists")

    friendship = Friendship(requester_id=current_user.id, addressee_id=body.addressee_id)
    db.add(friendship)
    await db.commit()
    await db.refresh(friendship)
    return friendship

@router.patch("/{friendship_id}")
async def respond_to_request(
    friendship_id: int,
    body: FriendshipAction,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Friendship).where(Friendship.id == friendship_id))
    friendship = result.scalar_one_or_none()
    if not friendship:
        raise HTTPException(404, "Not found")
    if friendship.addressee_id != current_user.id:
        raise HTTPException(403, "Not authorised")

    if body.action == "accept":
        friendship.status = "accepted"
    elif body.action == "reject":
        await db.delete(friendship)
        await db.commit()
        return {"ok": True}
    elif body.action == "block":
        friendship.status = "blocked"

    await db.commit()
    await db.refresh(friendship)
    return friendship

@router.get("/me", response_model=list[FriendshipResponse])
async def my_friends(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            and_(
                or_(
                    Friendship.requester_id == current_user.id,
                    Friendship.addressee_id == current_user.id,
                ),
                Friendship.status == "accepted",
            )
        )
    )
    return result.scalars().all()


@router.get("/pending", response_model=list[FriendshipResponse])
async def pending_requests(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            Friendship.addressee_id == current_user.id,
            Friendship.status == "pending",
        )
    )
    return result.scalars().all()


@router.delete("/{friendship_id}", status_code=204)
async def remove_friend(
    friendship_id: int,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Friendship).where(Friendship.id == friendship_id))
    friendship = result.scalar_one_or_none()
    if not friendship:
        raise HTTPException(404, "Not found")
    if current_user.id not in (friendship.requester_id, friendship.addressee_id):
        raise HTTPException(403, "Not authorised")
    await db.delete(friendship)
    await db.commit()