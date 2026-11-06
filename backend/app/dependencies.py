from fastapi import Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.services import auth_service


async def get_current_user(
    request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = await auth_service.get_user_by_id(db, user_id)
    if user is None:
        request.session.clear()
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user