"""Feedback endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_resident, get_db, require_admin_roles
from app.models.enums import AdminRole
from app.models.resident import Resident
from app.schemas.feedback import FeedbackCreateRequest, FeedbackOut
from app.services import feedback_service
from app.services.errors import ConflictError, InvalidStateError, NotFoundError

router = APIRouter(prefix="/complaints", tags=["feedback"])


@router.post("/{complaint_id}/feedback", response_model=FeedbackOut, status_code=status.HTTP_201_CREATED)
def give_feedback(
    complaint_id: int,
    req: FeedbackCreateRequest,
    db: Session = Depends(get_db),
    resident: Resident = Depends(get_current_resident),
) -> FeedbackOut:
    try:
        return feedback_service.give_feedback(db, resident, complaint_id, req.rating, req.comment)
    except NotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except InvalidStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except ConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc


@router.get("/{complaint_id}/feedback", response_model=FeedbackOut)
def get_feedback(
    complaint_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin_roles(AdminRole.HOUSING_OFFICE, AdminRole.IT_ADMIN, AdminRole.SUPER_ADMIN)),
) -> FeedbackOut:
    row = feedback_service.get_feedback(db, complaint_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No feedback for this complaint yet.")
    return row
