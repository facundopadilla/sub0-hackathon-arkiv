from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field, SQLModel

from src.models.base_model import BaseTable


class Milestone(BaseTable, table=True):
    """DB model for a project milestone."""

    # foreign key to projects table (uses project_id string)
    project_id: str = Field(index=True, nullable=False)

    name: str
    description: Optional[str] = None
    amount: float


class MilestoneCreate(BaseModel):
    """Schema for creating a new milestone (excludes id and timestamps)."""
    project_id: str
    name: str
    description: Optional[str] = None
    amount: float


class MilestoneUpdate(BaseModel):
    """Schema for updating a milestone (all fields optional)."""
    project_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None





