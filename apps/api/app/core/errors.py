from fastapi import HTTPException
from pydantic import BaseModel


class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None


def bad_request(message: str) -> HTTPException:
    return HTTPException(status_code=400, detail=message)


def not_found(message: str) -> HTTPException:
    return HTTPException(status_code=404, detail=message)


def conflict(message: str) -> HTTPException:
    return HTTPException(status_code=409, detail=message)
