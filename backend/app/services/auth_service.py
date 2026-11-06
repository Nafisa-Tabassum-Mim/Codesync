from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import RegisterRequest


class EmailAlreadyExists(Exception):
    pass


class InvalidCredentials(Exception):
    pass


# used so a login for an unknown email takes about as long as a real one
_DUMMY_HASH = hash_password("not-a-real-password")


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email.lower()))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    return await db.get(User, user_id)


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    if await get_user_by_email(db, data.email):
        raise EmailAlreadyExists()

    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:  # two requests registered the same email at once
        await db.rollback()
        raise EmailAlreadyExists()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User:
    user = await get_user_by_email(db, email)
    if user is None:
        verify_password(password, _DUMMY_HASH)
        raise InvalidCredentials()
    if not verify_password(password, user.password_hash):
        raise InvalidCredentials()
    return user