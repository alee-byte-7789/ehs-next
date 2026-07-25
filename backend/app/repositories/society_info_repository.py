"""SocietyInfo repository — singleton row, seeded on first access if missing."""
from sqlalchemy.orm import Session

from app.models.society_info import SocietyInfo

_DEFAULT_ABOUT_TEXT = (
    "Employees Housing Society (EHS) is committed to providing a safe, "
    "well-maintained, and welcoming community for all residents. This "
    "app is part of that effort — making it easier to raise concerns, "
    "track their resolution, and stay informed about society matters."
)

_DEFAULT_DEPUTY_CHAIRMAN_MESSAGE = (
    "I urge every resident to abide by the rules of the EHS and to keep "
    "our society clean, and to maintain a healthy relationship among "
    "each other."
)


def get_or_seed(db: Session) -> SocietyInfo:
    info = db.query(SocietyInfo).filter(SocietyInfo.id == 1).first()
    if info:
        return info

    info = SocietyInfo(
        id=1,
        about_text=_DEFAULT_ABOUT_TEXT,
        secretary_name=None,
        secretary_designation="Secretary",
        deputy_chairman_name="Hasan Waqas Ghauri",
        deputy_chairman_message=_DEFAULT_DEPUTY_CHAIRMAN_MESSAGE,
    )
    db.add(info)
    db.commit()
    db.refresh(info)
    return info
