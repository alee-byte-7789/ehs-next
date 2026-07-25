"""Feedback service."""
from sqlalchemy.orm import Session

from app.models.enums import ComplaintStatus
from app.models.feedback import Feedback
from app.models.resident import Resident
from app.repositories import complaint_repository, feedback_repository
from app.services.errors import ConflictError, InvalidStateError, NotFoundError


def give_feedback(db: Session, resident: Resident, complaint_id: int, rating: int, comment: str | None) -> Feedback:
    complaint = complaint_repository.get_by_id(db, complaint_id)
    if not complaint or complaint.resident_id != resident.id:
        raise NotFoundError(f"No complaint with id {complaint_id} for this resident.")

    if complaint.status not in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED):
        raise InvalidStateError("Feedback can only be given once a complaint is resolved or closed.")

    if feedback_repository.get_by_complaint(db, complaint_id):
        raise ConflictError("Feedback has already been given for this complaint.")

    return feedback_repository.create(db, complaint_id, resident.id, rating, comment)


def get_feedback(db: Session, complaint_id: int) -> Feedback | None:
    return feedback_repository.get_by_complaint(db, complaint_id)
