import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.core.database import SessionLocal
from app.services import auth_service, collab_service
from app.services.collab_service import Client, hub

router = APIRouter(tags=["collaboration"])

UNAUTHENTICATED = 4401
FORBIDDEN = 4403
NOT_FOUND = 4404
ROOM_FULL = 4409


@router.websocket("/api/ws/rooms/{slug}")
async def room_socket(websocket: WebSocket, slug: str):
    # CORS does not cover WebSockets, so check the Origin header yourself
    print("WS origin:", websocket.headers.get("origin"))
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
            room = await collab_service.authorize(db, user, slug)
        except collab_service.RoomNotFound:
            await websocket.close(code=NOT_FOUND)
            return
        except collab_service.RoomForbidden:
            await websocket.close(code=FORBIDDEN)
            return
        client = Client(ws=websocket, user_id=user.id, name=user.name)
        room_language = room.language

    try:
        state = hub.join(slug, client)
    except collab_service.RoomFull:
        await websocket.close(code=ROOM_FULL)
        return

    try:
        await websocket.send_json(
            {
                "type": "init",
                "text": state.text,
                "language": state.language or room_language,
            }
        )
        await hub.broadcast_presence(slug)

        while True:
            raw = await websocket.receive_text()
            if len(raw) > collab_service.MAX_MESSAGE_CHARS:
                await websocket.close(code=1009)
                break
            try:
                msg = json.loads(raw)
            except ValueError:
                continue
            if not isinstance(msg, dict):
                continue

            # relay run results to everyone else in the room
            if msg.get("type") == "output":
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

            if msg.get("type") != "update":
                continue
            text = msg.get("text")
            if not isinstance(text, str) or len(text) > collab_service.MAX_DOC_CHARS:
                continue

            hub.update(slug, text, msg.get("language"))
            await hub.broadcast(
                slug,
                {
                    "type": "update",
                    "text": text,
                    "language": state.language,
                    "user": client.name,
                },
                exclude=client,
            )
    except WebSocketDisconnect:
        pass
    finally:
        hub.leave(slug, client)
        await hub.broadcast_presence(slug)
