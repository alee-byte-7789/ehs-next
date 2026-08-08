"""
Auth-related Pydantic schemas.

Every resident supplies a CNIC. Beyond that there is one branching
question:

    Are you a tenant?                  (affects: resident_type + owner fields)
      YES -> collect owner_house_number, owner_name,
             owner_cnic, owner_mobile_number   (resident_type = TENANT)
      NO  -> no extra fields                    (resident_type = OWNER)

The former "Are you an AWC Employee?" question (and its employee_number
field) was removed: employee status did not affect anything in the
complaint flow, and CNIC is what the housing office actually verifies a
resident against.

`resident_type` is derived server-side from `is_tenant` alone, rather than
accepted directly from the client, so a client can't submit
`resident_type=owner` while also sending tenant-only fields (or vice versa)
and end up in an inconsistent state.
"""
from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.enums import VerificationStatus


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    house_number: str = Field(min_length=1, max_length=20, description='e.g. "B-026"')
    mobile_number: str = Field(min_length=7, max_length=20)
    email: str | None = None
    password: str = Field(min_length=8, max_length=128)

    # Pakistani CNIC. Accepted with or without dashes and normalised to 13
    # digits, so "12345-1234567-1" and "1234512345671" are the same person.
    cnic: str = Field(min_length=13, max_length=15, description='e.g. "12345-1234567-1"')

    # Device push tokens, captured HERE rather than after sign-in.
    #
    # A pending resident cannot authenticate at all (authenticate_resident
    # rejects PENDING), so there is no later moment to collect these before
    # approval. Without them the one notification a waiting resident most
    # wants — "your registration is approved" — has no device to go to.
    # Optional: registration must still work if the user declines
    # notification permission.
    fcm_token: str | None = None
    expo_push_token: str | None = None

    is_tenant: bool = False
    owner_house_number: str | None = None
    owner_name: str | None = None
    owner_cnic: str | None = None
    owner_mobile_number: str | None = None

    @field_validator("house_number")
    @classmethod
    def normalize_house_number(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("cnic")
    @classmethod
    def normalize_cnic(cls, v: str) -> str:
        """Strips dashes/spaces and requires exactly 13 digits.

        Normalising at the edge (rather than storing whatever was typed)
        is what makes the duplicate check in auth_service meaningful — the
        same CNIC written two different ways must collide.
        """
        digits = "".join(ch for ch in v if ch.isdigit())
        if len(digits) != 13:
            raise ValueError("CNIC must be 13 digits, e.g. 12345-1234567-1.")
        return digits

    @model_validator(mode="after")
    def validate_branches(self) -> "RegisterRequest":
        if self.is_tenant:
            required = {
                "owner_house_number": self.owner_house_number,
                "owner_name": self.owner_name,
                "owner_cnic": self.owner_cnic,
                "owner_mobile_number": self.owner_mobile_number,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError(f"Tenant registration requires: {', '.join(missing)}")
        else:
            if any([self.owner_house_number, self.owner_name, self.owner_cnic, self.owner_mobile_number]):
                raise ValueError("Owner details must be omitted unless is_tenant is true.")

        return self


class RegisterResponse(BaseModel):
    message: str
    resident_id: int
    verification_status: VerificationStatus


class LoginRequest(BaseModel):
    """`identifier` accepts either the resident's phone or email."""
    identifier: str
    password: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class MessageResponse(BaseModel):
    message: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
