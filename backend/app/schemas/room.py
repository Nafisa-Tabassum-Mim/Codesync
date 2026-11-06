from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator

Language = Literal["python", "javascript", "typescript", "java"]


class CreateRoomRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    language: Language = "javascript"

    @field_validator("name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Room name cannot be empty")
        return v


class RoomResponse(BaseModel):
    id: int
    slug: str
    name: str
    language: str
    owner_name: str
    is_owner: bool
    member_count: int
    created_at: datetime
    joined_at: datetime | None = None

    # stored as naive UTC; mark it as UTC so the browser reads it correctly
    @field_validator("created_at", "joined_at")
    @classmethod
    def as_utc(cls, v):
        if v is not None and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v