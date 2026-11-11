import secrets

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room, RoomMember
from app.models.user import User
from app.schemas.room import CreateRoomRequest

MAX_ROOMS_PER_USER = 20


class RoomNotFound(Exception):
    pass


class RoomLimitReached(Exception):
    pass


def _room_dict(room, *, owner_name, is_owner, member_count, joined_at=None):
    return {
        "id": room.id,
        "slug": room.slug,
        "name": room.name,
        "language": room.language,
        "owner_name": owner_name,
        "is_owner": is_owner,
        "member_count": member_count,
        "created_at": room.created_at,
        "joined_at": joined_at,
    }


async def _member_counts(db: AsyncSession, room_ids: list[int]) -> dict[int, int]:
    if not room_ids:
        return {}
    result = await db.execute(
        select(RoomMember.room_id, func.count(RoomMember.id))
        .where(RoomMember.room_id.in_(room_ids))
        .group_by(RoomMember.room_id)
    )
    return {room_id: count for room_id, count in result.all()}


async def create_room(db: AsyncSession, user: User, data: CreateRoomRequest) -> dict:
    owned = await db.scalar(
        select(func.count(Room.id)).where(Room.owner_id == user.id)
    )
    if (owned or 0) >= MAX_ROOMS_PER_USER:
        raise RoomLimitReached()

    room = Room(
        slug=secrets.token_urlsafe(16),  # unguessable
        name=data.name,
        language=data.language,
        owner_id=user.id,
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return _room_dict(room, owner_name=user.name, is_owner=True, member_count=1)


async def list_owned_rooms(db: AsyncSession, user: User) -> list[dict]:
    result = await db.execute(
        select(Room).where(Room.owner_id == user.id).order_by(Room.created_at.desc())
    )
    rooms = result.scalars().all()
    counts = await _member_counts(db, [r.id for r in rooms])
    return [
        _room_dict(
            r,
            owner_name=user.name,
            is_owner=True,
            member_count=1 + counts.get(r.id, 0),
        )
        for r in rooms
    ]


async def list_shared_rooms(db: AsyncSession, user: User) -> list[dict]:
    result = await db.execute(
        select(Room, RoomMember.joined_at, User.name)
        .join(RoomMember, RoomMember.room_id == Room.id)
        .join(User, User.id == Room.owner_id)
        .where(RoomMember.user_id == user.id)
        .order_by(RoomMember.joined_at.desc())
    )
    rows = result.all()
    counts = await _member_counts(db, [room.id for room, _, _ in rows])
    return [
        _room_dict(
            room,
            owner_name=owner_name,
            is_owner=False,
            member_count=1 + counts.get(room.id, 0),
            joined_at=joined_at,
        )
        for room, joined_at, owner_name in rows
    ]


async def delete_room(db: AsyncSession, user: User, room_id: int) -> None:
    room = await db.get(Room, room_id)
    # a room that belongs to someone else looks the same as a missing one
    if room is None or room.owner_id != user.id:
        raise RoomNotFound()
    await db.delete(room)
    await db.commit()


async def join_room(db: AsyncSession, user: User, slug: str) -> dict:
    user_id = user.id
    result = await db.execute(
        select(Room, User.name)
        .join(User, User.id == Room.owner_id)
        .where(Room.slug == slug)
    )
    row = result.first()
    if row is None:
        raise RoomNotFound()

    room, owner_name = row
    info = _room_dict(
        room,
        owner_name=owner_name,
        is_owner=room.owner_id == user_id,
        member_count=1,
    )

    if not info["is_owner"]:
        existing = await db.scalar(
            select(RoomMember.id).where(
                RoomMember.room_id == info["id"], RoomMember.user_id == user_id
            )
        )
        if existing is None:
            db.add(RoomMember(room_id=info["id"], user_id=user_id))
            try:
                await db.commit()
            except IntegrityError:  # joined twice at the same moment
                await db.rollback()

    counts = await _member_counts(db, [info["id"]])
    info["member_count"] = 1 + counts.get(info["id"], 0)
    
    
    names = await db.scalars(
        select(User.name)
        .join(RoomMember, RoomMember.user_id == User.id)
        .where(RoomMember.room_id == info["id"])
        .order_by(RoomMember.joined_at)
        .limit(20)
    )
    info["members"] = [owner_name, *names.all()]
    return info