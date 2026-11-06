from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app import models  # noqa: F401  (registers tables)
from app.controllers import auth_controller, execution_controller
from app.core.config import settings
from app.core.database import Base, engine

from app.controllers import auth_controller, execution_controller, room_controller


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # creates `users` table
    yield
    await engine.dispose()


app = FastAPI(title="CodeSync API", lifespan=lifespan)

# session first, CORS last, so CORS is the outermost layer
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
    session_cookie="codesync_session",
    max_age=60 * 60 * 24 * 7,  # 7 days
    same_site="lax",
    https_only=settings.COOKIE_SECURE,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_controller.router)
app.include_router(execution_controller.router)
app.include_router(room_controller.router)
