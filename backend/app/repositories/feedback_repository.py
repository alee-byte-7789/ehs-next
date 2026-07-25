"""Feedback repository — plain DB access."""
from sqlalchemy.orm import Session

from app.models.feedback import Feedback


def get_by_complaint(db: Session, complaint_id: int) -> Feedback | None:
    return db.query(Feedback).filter(Feedback.complaint_id == complaint_id).first()


def create(db: Session, complaint_id: int, resident_id: int, rating: int, comment: str | None) -> Feedback:
    row = Feedback(complaint_id=complaint_id, resident_id=resident_id, rating=rating, comment=comment)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
