from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import LoginRequest, RegisterRequest, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _start_session(request: Request, user: User) -> None:
    request.session.clear()  # drop any old session first
    request.session["user_id"] = user.id


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(
    data: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    try:
        user = await auth_service.register_user(db, data)
    except auth_service.EmailAlreadyExists:
        raise HTTPException(
            status_code=409, detail="An account with this email already exists"
        )
    _start_session(request, user)
    return user


@router.post("/login", response_model=UserResponse)
async def login(
    data: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)
):
    try:
        user = await auth_service.authenticate_user(db, data.email, data.password)
    except auth_service.InvalidCredentials:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _start_session(request, user)
    return user


@router.post("/logout", status_code=204)
async def logout(request: Request):
    request.session.clear()
    return Response(status_code=204)


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user