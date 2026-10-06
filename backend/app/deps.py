"""Shared FastAPI dependencies: DB session, current user, role guards."""

from typing import Callable

from fastapi import Depends, HTTPException, Path, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.user import Role, User
from app.services.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Session


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve the authenticated user from ``Authorization: Bearer <token>``."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None
    user = db.get(User, int(payload.get("sub", 0)))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*roles: Role) -> Callable[..., User]:
    """Dependency factory: current user must have one of ``roles``."""

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in {role.value for role in roles}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {[role.value for role in roles]}",
            )
        return current_user

    return checker


def get_project(
    project_id: int = Path(..., description="Project id"),
    db: Session = Depends(get_db),
) -> Project:
    """Load a project or raise 404."""
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def require_project_edit(
    project: Project = Depends(get_project),
    current_user: User = Depends(get_current_user),
) -> Project:
    """Only the project's sponsor (or an ADMIN) may edit project resources."""
    if current_user.role == Role.ADMIN.value or project.sponsor_id == current_user.id:
        return project
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only the project sponsor can perform this action",
    )
