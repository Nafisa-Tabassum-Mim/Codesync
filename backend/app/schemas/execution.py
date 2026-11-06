from pydantic import BaseModel

class ExecuteRequest(BaseModel):
    language: str
    sourceCode: str