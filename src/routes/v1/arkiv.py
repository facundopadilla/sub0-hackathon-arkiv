from typing import List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from arkiv import Arkiv
from src.core.depends.arkiv import get_arkiv_client
from src.core.depends.db import get_async_session
from src.models.evaluate import EvaluateResponse
from src.models.milestone import Milestone, MilestoneCreate, MilestoneUpdate
from src.models.project import Project, ProjectCreate, ProjectUpdate
from src.models.sponsor import (
    SponsoredProject,
    SponsoredProjectCreate,
    SponsoredProjectUpdate,
    SponsoredProjectOut,
    SponsorRequest,
)
from src.services.arkiv import ArkivService
from src.services.ai import AIService
from src.services.milestone import MilestoneService
from src.services.project import ProjectService
from src.services.sponsor import SponsoredProjectService

router = APIRouter(prefix="/arkiv")

@router.get("/projects", response_model=List[Project])
async def list_projects(skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_async_session)):
    """
    List all projects with pagination.
    """
    projects = await ProjectService.list_all(session, skip=skip, limit=limit)
    return projects


@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Get a specific project by ID.
    """
    project = await ProjectService.get_by_id(project_id, session)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, session: AsyncSession = Depends(get_async_session)):
    """
    Create a new project.
    """
    project_data = project.dict(exclude_unset=True)
    created_project = await ProjectService.create(project_data, session)
    return created_project


@router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: int, project_update: ProjectUpdate, session: AsyncSession = Depends(get_async_session)):
    """
    Update an existing project.
    """
    update_data = project_update.dict(exclude_unset=True)
    updated_project = await ProjectService.update(project_id, update_data, session)
    if not updated_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return updated_project


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Delete a project by ID.
    """
    deleted = await ProjectService.delete(project_id, session)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")


# ==================== MILESTONE ENDPOINTS ====================

@router.get("/milestones", response_model=List[Milestone])
async def list_milestones(skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_async_session)):
    """
    List all milestones with pagination.
    """
    milestones = await MilestoneService.list_all(session, skip=skip, limit=limit)
    return milestones


@router.get("/milestones/by-project/{project_id}", response_model=List[Milestone])
async def list_milestones_by_project(project_id: int, skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_async_session)):
    """
    List all milestones for a specific project with pagination.
    """
    milestones = await MilestoneService.list_by_project(project_id, session, skip=skip, limit=limit)
    return milestones


@router.get("/milestones/{milestone_id}", response_model=Milestone)
async def get_milestone(milestone_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Get a specific milestone by ID.
    """
    milestone = await MilestoneService.get_by_id(milestone_id, session)
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return milestone


@router.post("/milestones", response_model=Milestone, status_code=status.HTTP_201_CREATED)
async def create_milestone(milestone: MilestoneCreate, session: AsyncSession = Depends(get_async_session)):
    """
    Create a new milestone.
    """
    milestone_data = milestone.dict(exclude_unset=True)
    created_milestone = await MilestoneService.create(milestone_data, session)
    return created_milestone


@router.put("/milestones/{milestone_id}", response_model=Milestone)
async def update_milestone(milestone_id: int, milestone_update: MilestoneUpdate, session: AsyncSession = Depends(get_async_session)):
    """
    Update an existing milestone.
    """
    update_data = milestone_update.dict(exclude_unset=True)
    updated_milestone = await MilestoneService.update(milestone_id, update_data, session)
    if not updated_milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")
    return updated_milestone


@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(milestone_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Delete a milestone by ID.
    """
    deleted = await MilestoneService.delete(milestone_id, session)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found")


# ==================== SPONSORED PROJECT ENDPOINTS ====================

@router.get("/sponsored", response_model=List[SponsoredProject])
async def list_sponsored_projects(status_filter: Optional[str] = None, skip: int = 0, limit: int = 100, session: AsyncSession = Depends(get_async_session)):
    """
    List all sponsored projects with optional status filter and pagination.
    """
    if status_filter:
        sponsored_projects = await SponsoredProjectService.list_by_status(status_filter, session, skip=skip, limit=limit)
    else:
        sponsored_projects = await SponsoredProjectService.list_all(session, skip=skip, limit=limit)
    return sponsored_projects


@router.get("/sponsored/{sponsored_project_id}", response_model=SponsoredProject)
async def get_sponsored_project(sponsored_project_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Get a specific sponsored project by ID.
    """
    sponsored_project = await SponsoredProjectService.get_by_id(sponsored_project_id, session)
    if not sponsored_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sponsored project not found")
    return sponsored_project


@router.post("/sponsored", response_model=SponsoredProject, status_code=status.HTTP_201_CREATED)
async def create_sponsored_project(sponsored_project: SponsoredProjectCreate, session: AsyncSession = Depends(get_async_session)):
    """
    Create a new sponsored project.
    """
    sponsored_project_data = sponsored_project.dict(exclude_unset=True)
    created_sponsored_project = await SponsoredProjectService.create(sponsored_project_data, session)
    return created_sponsored_project


@router.put("/sponsored/{sponsored_project_id}", response_model=SponsoredProject)
async def update_sponsored_project(sponsored_project_id: int, sponsored_project_update: SponsoredProjectUpdate, session: AsyncSession = Depends(get_async_session)):
    """
    Update an existing sponsored project.
    """
    update_data = sponsored_project_update.dict(exclude_unset=True)
    updated_sponsored_project = await SponsoredProjectService.update(sponsored_project_id, update_data, session)
    if not updated_sponsored_project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sponsored project not found")
    return updated_sponsored_project


@router.delete("/sponsored/{sponsored_project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sponsored_project(sponsored_project_id: int, session: AsyncSession = Depends(get_async_session)):
    """
    Delete a sponsored project by ID.
    """
    deleted = await SponsoredProjectService.delete(sponsored_project_id, session)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sponsored project not found")


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(project_id: int = Query(..., description="Project ID to evaluate with AI"), session: AsyncSession = Depends(get_async_session)):
    """
    Evaluates a project using AI.
    """
    project = await ProjectService.get_by_id(project_id, session)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    
    evaluation = AIService.evaluate_project({
        "name": project.name,
        "description": project.description,
        "budget": project.budget,
        "milestones": getattr(project, "milestones", [])
    })
    return evaluation


@router.post("/sponsor")
async def save_sponsor(payload: SponsorRequest, client: Arkiv = Depends(get_arkiv_client), session: AsyncSession = Depends(get_async_session)):
    """
    Guarda el proyecto sponsoreado en Arkiv blockchain Y en la base de datos.
    Se asume que ya se creó el smart contract y se pasa su address.
    """
    # payload.project is a dict, so access its keys directly
    project = payload.project
    data = {
        "project_id": project.get("project_id", ""),
        "name": project.get("name", ""),
        "repo": project.get("repo", ""),
        "ai_score": payload.ai_score,
        "status": "submitted",  # ← Status siempre es "submitted" cuando se envía
        "contract_address": payload.contract_address,
        "chain": "asset_hub",
        "budget": project.get("budget", 0.0),
        "description": project.get("description", ""),
        "milestones": project.get("milestones", []),
    }

    # 1. Save to Arkiv blockchain
    arkiv_result = ArkivService.save_sponsored_project(client, data)
    entity_key = arkiv_result["entity_key"]
    tx_hash = arkiv_result.get("tx_hash")

    # 2. Save to database
    sponsored_data = {
        "project_id": data["project_id"],
        "name": data["name"],
        "repo": data["repo"],
        "ai_score": data["ai_score"],
        "status": data["status"],
        "contract_address": data["contract_address"],
        "chain": data["chain"],
        "budget": data["budget"],
        "description": data["description"],
        "entity_key": entity_key,
        "tx_hash": tx_hash,
    }
    
    created_sponsored = await SponsoredProjectService.create(sponsored_data, session)

    return {
        "entity_key": entity_key,
        "tx_hash": tx_hash,
        "status": "stored",
        "id": created_sponsored.id
    }


@router.get("/arkiv-sponsored", response_model=dict)
def get_sponsored_from_arkiv(status: Optional[str] = None):
    """
    Información sobre cómo acceder a proyectos sponsoreados desde Arkiv (blockchain).
    
    Note: Los proyectos sponsoreados se guardan en Arkiv usando POST /sponsor.
    Para leer desde Arkiv, usa un cliente que pueda consultar la blockchain.
    Los datos también se guardan en la BD local en POST /sponsored.
    """
    return {
        "message": "Arkiv integration active",
        "save_endpoint": "POST /sponsor - Saves to blockchain",
        "db_endpoint": "GET /sponsored - List from database",
        "notes": [
            "Projects are saved to Arkiv blockchain via POST /sponsor",
            "Entity keys are returned and can be used to retrieve data from Arkiv RPC",
            "For full blockchain querying, use Arkiv SDK directly with RPC endpoint",
        ]
    }

