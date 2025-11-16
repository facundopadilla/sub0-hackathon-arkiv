from typing import Optional

from pydantic import BaseModel


class MilestoneBase(BaseModel):
    project_id: str
    name: str
    description: Optional[str] = None
    amount: float

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneRead(MilestoneBase):
    pass

class MilestoneUpdate(MilestoneBase):
    pass
