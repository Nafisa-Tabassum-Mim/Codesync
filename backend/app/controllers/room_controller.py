from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.room import CreateRoomRequest, RoomResponse
from app.services import room_service

# every route needs a logged-in user (401 otherwise)
router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.get("", response_model=list[RoomResponse])
async def my_rooms(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await room_service.list_owned_rooms(db, user)


@router.get("/shared", response_model=list[RoomResponse])
async def shared_rooms(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await room_service.list_shared_rooms(db, user)


@router.post("", response_model=RoomResponse, status_code=201)
async def create_room(
    data: CreateRoomRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await room_service.create_room(db, user, data)
    except room_service.RoomLimitReached:
        raise HTTPException(
            409,
            f"You can have at most {room_service.MAX_ROOMS_PER_USER} rooms. "
            "Delete one to create another.",
        )


@router.delete("/{room_id}", status_code=204)
async def remove_room(
    room_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await room_service.delete_room(db, user, room_id)
    except room_service.RoomNotFound:
        raise HTTPException(404, "Room not found")
    return Response(status_code=204)


@router.post("/{slug}/join", response_model=RoomResponse)
async def join_room(
    slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await room_service.join_room(db, user, slug)
    except room_service.RoomNotFound:
        raise HTTPException(404, "Room not found")