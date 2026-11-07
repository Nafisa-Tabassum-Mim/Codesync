import asyncio
import json
from dataclasses import dataclass, field

from fastapi import WebSocket
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.room import Room, RoomMember
from app.models.user import User
from app.services.room_doc import RoomDoc

LANGUAGES = {"python", "javascript", "typescript", "java"}
MAX_UPDATE_BYTES = 1_000_000  # one Yjs update (binary frame)
MAX_SNIPPET_CHARS = 50_000  # starter code sent with seed / language switch
MAX_MESSAGE_CHARS = 400_000  # JSON text frames
MAX_CLIENTS_PER_ROOM = 20


class RoomNotFound(Exception):
    pass


class RoomForbidden(Exception):
    pass


class RoomFull(Exception):
    pass


async def authorize(db: AsyncSession, user: User, slug: str) -> Room:
    """Return the room if the user owns it or has joined it."""
    room = await db.scalar(select(Room).where(Room.slug == slug))
    if room is None:
        raise RoomNotFound()
    if room.owner_id == user.id:
        return room
    member_id = await db.scalar(
        select(RoomMember.id).where(
            RoomMember.room_id == room.id, RoomMember.user_id == user.id
        )
    )
    if member_id is None:
        raise RoomForbidden()
    return room


@dataclass(eq=False)
class Client:
    ws: WebSocket
    user_id: int
    name: str


@dataclass
class RoomState:
    doc: RoomDoc = field(default_factory=RoomDoc)
    clients: list[Client] = field(default_factory=list)


class CollabHub:
    def __init__(self) -> None:
        self._rooms: dict[str, RoomState] = {}

    def join(self, slug: str, client: Client) -> RoomState:
        state = self._rooms.setdefault(slug, RoomState())
        if len(state.clients) >= MAX_CLIENTS_PER_ROOM:
            raise RoomFull()
        state.clients.append(client)
        return state

    def leave(self, slug: str, client: Client) -> None:
        state = self._rooms.get(slug)
        if state and client in state.clients:
            state.clients.remove(client)

    async def _send_all(self, slug: str, send, exclude: Client | None) -> None:
        state = self._rooms.get(slug)
        if not state:
            return
        targets = [c for c in state.clients if c is not exclude]
        results = await asyncio.gather(
            *(send(c.ws) for c in targets), return_exceptions=True
        )
        for client, result in zip(targets, results):
            if isinstance(result, Exception):
                self.leave(slug, client)

    async def broadcast(self, slug: str, message: dict, exclude: Client | None = None):
        payload = json.dumps(message)
        await self._send_all(slug, lambda ws: ws.send_text(payload), exclude)

    async def broadcast_bytes(self, slug: str, data: bytes, exclude: Client | None = None):
        """Yjs updates travel as binary frames."""
        await self._send_all(slug, lambda ws: ws.send_bytes(data), exclude)

    async def broadcast_presence(self, slug: str) -> None:
        state = self._rooms.get(slug)
        if not state:
            return
        await self.broadcast(
            slug,
            {
                "type": "presence",
                "count": len(state.clients),
                "users": sorted({c.name for c in state.clients}),
            },
        )


hub = CollabHub()