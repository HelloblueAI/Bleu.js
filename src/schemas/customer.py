"""Customer schemas."""

from pydantic import BaseModel, ConfigDict


class CustomerBase(BaseModel):
    """Base customer model."""

    email: str
    name: str | None = None
    company: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomerCreate(CustomerBase):
    """Customer creation model."""

    pass


class CustomerUpdate(BaseModel):
    """Customer update model."""

    email: str | None = None
    name: str | None = None
    company: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    notes: str | None = None

    model_config = ConfigDict(from_attributes=True)


class CustomerInDB(CustomerBase):
    """Customer in database model."""

    id: str
    is_active: str
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class CustomerSchema(CustomerInDB):
    """Customer schema model."""

    pass


class CustomerResponse(BaseModel):
    """Customer response model."""

    id: str
    email: str
    name: str | None = None
    company: str | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    is_active: str
    notes: str | None = None
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)
