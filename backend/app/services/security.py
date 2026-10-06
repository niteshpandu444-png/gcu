"""Password hashing (pwdlib + Argon2) and JWT helpers (PyJWT)."""

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.config import get_settings
from app.models.user import User

_settings = get_settings()
_password_hash = PasswordHash.recommended()

ALGORITHM = _settings.jwt_algorithm


def hash_password(password: str) -> str:
    """Hash a plain password with Argon2id."""
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a plain password against its Argon2 hash."""
    return _password_hash.verify(password, password_hash)


def create_access_token(user: User) -> str:
    """Create a JWT access token for a user."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "iat": now,
        "exp": now + timedelta(minutes=_settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, _settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Raises jwt.PyJWTError on failure."""
    return jwt.decode(token, _settings.jwt_secret, algorithms=[ALGORITHM])
