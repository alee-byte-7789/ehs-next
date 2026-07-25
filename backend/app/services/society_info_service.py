"""Society info service."""
from sqlalchemy.orm import Session

from app.models.society_info import SocietyInfo
from app.repositories import society_info_repository


def get_society_info(db: Session) -> SocietyInfo:
    return society_info_repository.get_or_seed(db)
