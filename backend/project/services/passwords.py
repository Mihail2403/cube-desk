import secrets

import bcrypt

from project.core.config import config


def generate_user_salt() -> str:
    return secrets.token_hex(8)


def hash_password(*, password: str, user_salt: str) -> str:
    value = (password + user_salt + config.SALT).encode("utf-8")
    return bcrypt.hashpw(value, bcrypt.gensalt()).decode("utf-8")


def verify_password(*, password: str, user_salt: str, password_hash: str) -> bool:
    value = (password + user_salt + config.SALT).encode("utf-8")
    return bcrypt.checkpw(value, password_hash.encode("utf-8"))

