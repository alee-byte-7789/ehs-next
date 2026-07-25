"""SocietyInfo repository — singleton row, seeded on first access if missing."""
from sqlalchemy.orm import Session

from app.models.society_info import SocietyInfo

_DEFAULT_ABOUT_TEXT = (
    "Employees Housing Society (EHS) is committed to providing a safe, "
    "well-maintained, and welcoming community for all residents. This "
    "app is part of that effort — making it easier to raise concerns, "
    "track their resolution, and stay informed about society matters."
)

_DEFAULT_CHAIRMAN_MESSAGE = (
    "As Chairman of the Employees Housing Society, I am committed to "
    "ensuring that our community remains a safe, well-managed, and "
    "welcoming home for every resident. I encourage all of us to work "
    "together, respect one another, and take pride in the upkeep of our "
    "shared spaces. Together, we can make EHS a model society for others "
    "to follow."
)

_DEFAULT_DEPUTY_CHAIRMAN_MESSAGE = (
    "I urge every resident to abide by the rules of the EHS and to keep "
    "our society clean, and to maintain a healthy relationship among "
    "each other."
)

_DEFAULT_SECRETARY_MESSAGE = (
    "As Secretary, my priority is to ensure that the day-to-day "
    "administration of EHS runs smoothly and that every resident's "
    "concerns are heard and addressed promptly. I encourage residents to "
    "make full use of this platform to raise complaints and stay "
    "informed, and I remain committed to serving this community with "
    "transparency and diligence."
)


def get_or_seed(db: Session) -> SocietyInfo:
    info = db.query(SocietyInfo).filter(SocietyInfo.id == 1).first()
    if info:
        return info

    info = SocietyInfo(
        id=1,
        about_text=_DEFAULT_ABOUT_TEXT,
        chairman_name="Dr Naeem Zafar",
        chairman_message=_DEFAULT_CHAIRMAN_MESSAGE,
        deputy_chairman_name="Hasan Waqas Ghauri",
        deputy_chairman_message=_DEFAULT_DEPUTY_CHAIRMAN_MESSAGE,
        secretary_name="Imran Awan",
        secretary_designation="Secretary",
        secretary_message=_DEFAULT_SECRETARY_MESSAGE,
    )
    db.add(info)
    db.commit()
    db.refresh(info)
    return info


def update(db: Session, **fields) -> SocietyInfo:
    info = get_or_seed(db)
    for key, value in fields.items():
        if value is not None:
            setattr(info, key, value)
    db.commit()
    db.refresh(info)
    return info
