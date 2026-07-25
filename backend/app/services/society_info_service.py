"""Society info service."""
from sqlalchemy.orm import Session

from app.models.society_info import SocietyInfo
from app.repositories import society_info_repository
from app.schemas.society_info import SocietyInfoUpdateRequest


def get_society_info(db: Session) -> SocietyInfo:
    return society_info_repository.get_or_seed(db)


def update_society_info(db: Session, req: SocietyInfoUpdateRequest) -> SocietyInfo:
    return society_info_repository.update(db, **req.model_dump(exclude_unset=True))
