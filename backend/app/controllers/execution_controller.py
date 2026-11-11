from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.execution import ExecuteRequest
from app.services import execution_service

router = APIRouter(prefix="/api", tags=["execution"])


@router.post("/execute")
async def execute(req: ExecuteRequest, user: User = Depends(get_current_user)):
    # get_current_user returns 401 if the user is not logged in
    try:
        return await execution_service.execute_code(req.language, req.sourceCode)
    except execution_service.UnsupportedLanguage:
        supported = ", ".join(execution_service.RUNNERS)
        raise HTTPException(
            400, f"Unsupported language: {req.language!r}. Supported: {supported}"
        )
    except execution_service.CodeTooLarge:
        raise HTTPException(400, "Source code too large")