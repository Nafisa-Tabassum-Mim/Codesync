import json

from fastapi import APIRouter, WebSocket

from app.core.config import settings
from app.core.database import SessionLocal
from app.services import auth_service, collab_service
from app.services.collab_service import Client, hub
from app.services.room_doc import EMPTY_UPDATE, InvalidUpdate

router = APIRouter(tags=["collaboration"])

UNAUTHENTICATED = 4401
FORBIDDEN = 4403
NOT_FOUND = 4404
ROOM_FULL = 4409


@router.websocket("/api/ws/rooms/{slug}")
async def room_socket(websocket: WebSocket, slug: str):
    # CORS does not cover WebSockets, so check the Origin header yourself
    if websocket.headers.get("origin") not in settings.CORS_ORIGINS:
        await websocket.close(code=1008)
        return
    await websocket.accept()
    user_id = websocket.session.get("user_id")
    if not user_id:
        await websocket.close(code=UNAUTHENTICATED)
        return
    async with SessionLocal() as db:
        user = await auth_service.get_user_by_id(db, user_id)
        if user is None:
            await websocket.close(code=UNAUTHENTICATED)
            return
        try:
            await collab_service.authorize(db, user, slug)
        except collab_service.RoomNotFound:
            await websocket.close(code=NOT_FOUND)
            return
        except collab_service.RoomForbidden:
            await websocket.close(code=FORBIDDEN)
            return
        client = Client(ws=websocket, user_id=user.id, name=user.name)
    try:
        state = hub.join(slug, client)
    except collab_service.RoomFull:
        await websocket.close(code=ROOM_FULL)
        return

    doc = state.doc
    try:
        # 1) everything the room has so far, 2) then tell the client it is caught up
        await websocket.send_bytes(doc.full_state())
        await websocket.send_json({"type": "synced"})
        await hub.broadcast_presence(slug)

        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break

            # ---- binary frame: a Yjs update (typing, or full state on reconnect)
            data = message.get("bytes")
            if data is not None:
                if len(data) > collab_service.MAX_UPDATE_BYTES:
                    await websocket.close(code=1009)
                    break
                try:
                    news = doc.apply(data)
                except InvalidUpdate:
                    continue
                if news != EMPTY_UPDATE:  # duplicates are not re-broadcast
                    await hub.broadcast_bytes(slug, news, exclude=client)
                continue

            # ---- text frame: JSON control messages
            raw = message.get("text")
            if raw is None:
                continue
            if len(raw) > collab_service.MAX_MESSAGE_CHARS:
                await websocket.close(code=1009)
                break
            try:
                msg = json.loads(raw)
            except ValueError:
                continue
            if not isinstance(msg, dict):
                continue
            kind = msg.get("type")

            if kind == "output":  # relay run results to everyone else
                output = msg.get("output")
                if not isinstance(output, str) or len(output) > 200_000:
                    continue
                await hub.broadcast(
                    slug,
                    {
                        "type": "output",
                        "output": output,
                        "isError": bool(msg.get("isError")),
                        "user": client.name,
                    },
                    exclude=client,
                )
                continue

            if kind in ("seed", "language"):
                language, snippet = msg.get("language"), msg.get("snippet")
                # a language switch may omit the snippet (keep the code as it is)
                snippet_ok = (snippet is None and kind == "language") or (
                    isinstance(snippet, str)
                    and len(snippet) <= collab_service.MAX_SNIPPET_CHARS
                )
                if language not in collab_service.LANGUAGES or not snippet_ok:
                    continue
                # the server decides the order, so two people clicking at once
                # (or two people opening an empty room) cannot clash
                news = (
                    doc.seed(language, snippet)
                    if kind == "seed"
                    else doc.set_language(language, snippet)
                )
                if news != EMPTY_UPDATE:
                    await hub.broadcast_bytes(slug, news)  # everyone, sender included
    finally:
        hub.leave(slug, client)
        await hub.broadcast_presence(slug)