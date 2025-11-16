from typing import Optional

from pydantic import BaseModel
from sqlmodel import Field

from src.models.base_model import BaseTable


class SponsoredProject(BaseTable, table=True):
    """DB model for a sponsored project."""
    
    project_id: str = Field(index=True)
    name: str
    repo: str
    ai_score: float
    status: str
    contract_address: str
    chain: str
    budget: float
    description: Optional[str] = None
    entity_key: Optional[str] = None
    tx_hash: Optional[str] = None
    polkadot_smart_contract: Optional[str] = None


class SponsoredProjectCreate(BaseModel):
    """Schema for creating a new sponsored project (excludes id and timestamps)."""
    
    project_id: str
    name: str
    repo: str
    ai_score: float
    status: str
    contract_address: str
    chain: str
    budget: float
    description: Optional[str] = None
    entity_key: Optional[str] = None
    tx_hash: Optional[str] = None
    polkadot_smart_contract: Optional[str] = None


class SponsoredProjectUpdate(BaseModel):
    """Schema for updating a sponsored project (all fields optional)."""
    
    project_id: Optional[str] = None
    name: Optional[str] = None
    repo: Optional[str] = None
    ai_score: Optional[float] = None
    status: Optional[str] = None
    contract_address: Optional[str] = None
    chain: Optional[str] = None
    budget: Optional[float] = None
    description: Optional[str] = None
    entity_key: Optional[str] = None
    tx_hash: Optional[str] = None
    polkadot_smart_contract: Optional[str] = None


class SponsorRequest(BaseModel):
    """Schema for sponsor request (used in Arkiv integration)."""
    
    project: dict
    ai_score: float
    decision: str
    contract_address: str


class SponsoredProjectOut(BaseModel):
    """Schema for sponsored project output (used in Arkiv integration)."""
    
    project_id: str
    name: str
    repo: str
    ai_score: float
    status: str
    contract_address: str
    chain: str
    budget: float
    description: Optional[str] = None
    entity_key: Optional[str] = None
    tx_hash: Optional[str] = None
    polkadot_smart_contract: Optional[str] = None
