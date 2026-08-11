"""Schemas for admin-initiated account management.

These cover actions an admin performs ON someone else's account —
resetting a resident's or another admin's password, deleting a
registration, and creating a resident manually. Kept separate from
`auth.py` (self-service) and `resident.py` (read models) so the
privileged surface is easy to find and review in one place.
"""
from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import ResidentType


class ResetPasswordRequest(BaseModel):
    """Used for both resident and admin password resets.

    Deliberately does NOT accept the old password: the whole point is that
    the account holder has forgotten it. Authority comes from the acting
    admin's own token and role, which is checked by the route's RBAC
    dependency — not from knowing the target's current credentials.
    """

    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Password cannot be blank.")
        return v


class DeleteRegistrationRequest(BaseModel):
    """Reason is required. A deletion is irreversible, so the audit entry
    should say why it happened, not just that it did.

    `force` must be sent explicitly to remove a resident who has complaints
    or feedback — the caller has to opt in to destroying that history, it
    can never happen by accident.
    """

    reason: str = Field(min_length=3, max_length=300)
    force: bool = False


class ManualRegisterRequest(BaseModel):
    """Admin-created resident.

    Mirrors the fields of the self-service RegisterRequest, minus the push
    tokens (there is no device to register — the admin is filling this in
    on the resident's behalf).

    Unlike self-registration this creates the resident already APPROVED:
    an admin entering someone by hand has, by definition, already verified
    them, so making them then approve their own entry would be theatre.
    """

    full_name: str = Field(min_length=2, max_length=120)
    house_number: str = Field(min_length=1, max_length=30)
    mobile_number: str = Field(min_length=7, max_length=20)
    email: str | None = None
    password: str = Field(min_length=8, max_length=128)
    cnic: str = Field(min_length=13, max_length=15, description='e.g. "12345-1234567-1"')

    is_tenant: bool = False
    owner_house_number: str | None = None
    owner_name: str | None = None
    owner_cnic: str | None = None
    owner_mobile_number: str | None = None

    @field_validator("cnic")
    @classmethod
    def normalize_cnic(cls, v: str) -> str:
        """Same normalisation as self-registration, so a CNIC entered by an
        admin collides correctly with one entered by the resident."""
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) != 13:
            raise ValueError("CNIC must be 13 digits, e.g. 12345-1234567-1.")
        return digits

    @model_validator(mode="after")
    def validate_tenant_branch(self) -> "ManualRegisterRequest":
        if self.is_tenant:
            missing = [
                name for name, value in {
                    "owner_house_number": self.owner_house_number,
                    "owner_name": self.owner_name,
                    "owner_cnic": self.owner_cnic,
                    "owner_mobile_number": self.owner_mobile_number,
                }.items() if not value
            ]
            if missing:
                raise ValueError(f"Tenant registration requires: {', '.join(missing)}.")
        elif any([self.owner_house_number, self.owner_name, self.owner_cnic, self.owner_mobile_number]):
            raise ValueError("Owner details must be omitted unless is_tenant is true.")
        return self

    @property
    def resident_type(self) -> ResidentType:
        return ResidentType.TENANT if self.is_tenant else ResidentType.OWNER
