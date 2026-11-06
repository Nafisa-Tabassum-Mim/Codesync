from fastapi import APIRouter, HTTPException

from app.schemas.execution import ExecuteRequest
from app.services import execution_service

router = APIRouter(prefix="/api", tags=["execution"])


@router.post("/execute")
async def execute(req: ExecuteRequest):
    try:
        return await execution_service.execute_code(req.language, req.sourceCode)
    except execution_service.UnsupportedLanguage:
        supported = ", ".join(execution_service.RUNNERS)
        raise HTTPException(
            400, f"Unsupported language: {req.language!r}. Supported: {supported}"
        )
    except execution_service.CodeTooLarge:
        raise HTTPException(400, "Source code too large")