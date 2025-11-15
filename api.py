# api.py
from typing import List, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field

from arkiv_client import (
    create_client,
    save_sponsored_project,
    list_sponsored_projects,
)

app = FastAPI(title="Sub0 Funding Oracle API")

client = create_client()

# Models
class Milestone(BaseModel):
    name: str
    description: Optional[str] = None
    amount: float


class Project(BaseModel):
    project_id: str
    name: str
    repo: str
    description: Optional[str] = None
    budget: float
    milestones: List[Milestone] = Field(default_factory=list)


class EvaluateResponse(BaseModel):
    ai_score: float
    decision: str  # "approve" | "reject" | "borderline"
    rationale: str


class SponsorRequest(BaseModel):
    project: Project
    ai_score: float
    decision: str
    contract_address: str


class SponsoredProjectOut(BaseModel):
    project_id: str
    name: str
    repo: str
    ai_score: float
    status: str
    contract_address: str
    chain: str
    budget: float
    description: Optional[str] = None
    _entity_key: Optional[str] = None


# Endpoints
@app.get("/")
def root():
    return {"status": "ok", "message": "Sub0 Funding Oracle API"}


@app.post("/evaluate", response_model=EvaluateResponse)
def evaluate(project: Project):
    """
    "IA" simple para el MVP.
    Podés mejorar esto luego metiendo un LLM o reglas más pro.
    """
    # Heurística básica: menos presupuesto, más score
    base_score = max(0.1, min(1.0, 1.2 - (project.budget / 10_000)))

    # Bonus si tiene varios milestones bien definidos
    milestones_bonus = min(0.2, 0.05 * len(project.milestones))

    ai_score = round(base_score + milestones_bonus, 3)

    if ai_score >= 0.75:
        decision = "approve"
        rationale = "Presupuesto razonable y milestones claros."
    elif ai_score >= 0.5:
        decision = "borderline"
        rationale = "Caso interesante pero con riesgos; requiere revisión humana."
    else:
        decision = "reject"
        rationale = "Relación valor/presupuesto poco atractiva para sponsoring."

    return EvaluateResponse(
        ai_score=ai_score,
        decision=decision,
        rationale=rationale,
    )


@app.post("/sponsor")
def sponsor(req: SponsorRequest):
    """
    Guarda el proyecto sponsoreado en Arkiv.
    Se asume que ya se creó el smart contract y se pasa su address.
    """
    data = {
        "project_id": req.project.project_id,
        "name": req.project.name,
        "repo": req.project.repo,
        "ai_score": req.ai_score,
        "status": req.decision,
        "contract_address": req.contract_address,
        "chain": "asset_hub",
        "budget": req.project.budget,
        "description": req.project.description,
        "milestones": [m.dict() for m in req.project.milestones],
    }

    entity_key = save_sponsored_project(client, data)

    return {"entity_key": entity_key, "status": "stored"}


@app.get("/sponsored", response_model=List[SponsoredProjectOut])
def get_sponsored(status: Optional[str] = None):
    """
    Lista proyectos sponsoreados desde Arkiv.
    """
    projects = list_sponsored_projects(client, status=status)
    out: List[SponsoredProjectOut] = []

    for p in projects:
        out.append(
            SponsoredProjectOut(
                project_id=p.get("project_id", ""),
                name=p.get("name", ""),
                repo=p.get("repo", ""),
                ai_score=float(p.get("ai_score", 0)),
                status=p.get("status", ""),
                contract_address=p.get("contract_address", ""),
                chain=p.get("chain", ""),
                budget=float(p.get("budget", 0)),
                description=p.get("description"),
                _entity_key=p.get("_entity_key"),
            )
        )

    return out
