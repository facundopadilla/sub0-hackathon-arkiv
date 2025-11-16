"""
AI Query Routes - LangChain endpoints for querying Arkiv entities
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from src.core.depends.db import get_async_session
from src.models.sponsor import SponsoredProject
from src.services.langchain_service import get_langchain_service
from src.services.arkiv import ArkivService
from arkiv import Arkiv
from src.core.depends.arkiv import get_arkiv_client

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/query-project")
async def query_project(
    project_id: int,
    question: str = Query(..., description="Question to ask about the project"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Ask an AI question about a specific project stored in Arkiv.

    Args:
        project_id: ID of the project in database
        question: Question to ask about the project

    Returns:
        AI-generated answer based on project data
    """
    try:
        # Get project from database
        query = select(SponsoredProject).where(SponsoredProject.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Convert project to dictionary for AI
        project_data = {
            "id": project.id,
            "project_id": project.project_id,
            "name": project.name,
            "description": project.description,
            "sponsor": project.sponsor,
            "budget": project.budget,
            "status": project.status,
            "chain": project.chain,
            "entity_key": project.entity_key,
            "polkadot_smart_contract": project.polkadot_smart_contract,
            "created_at": str(project.created_at),
        }

        # Query using LangChain
        service = get_langchain_service()
        answer = service.query_entity(project_data, question, "project")

        return {
            "success": True,
            "project_id": project_id,
            "question": question,
            "answer": answer,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error querying project: {str(e)}")


@router.get("/summarize-project/{project_id}")
async def summarize_project(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Generate an AI summary of a project.

    Args:
        project_id: ID of the project to summarize

    Returns:
        AI-generated summary
    """
    try:
        # Get project from database
        query = select(SponsoredProject).where(SponsoredProject.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Convert project to dictionary
        project_data = {
            "id": project.id,
            "project_id": project.project_id,
            "name": project.name,
            "description": project.description,
            "sponsor": project.sponsor,
            "budget": project.budget,
            "status": project.status,
            "created_at": str(project.created_at),
        }

        # Generate summary
        service = get_langchain_service()
        summary = service.summarize_entity(project_data, "project")

        return {
            "success": True,
            "project_id": project_id,
            "project_name": project.name,
            "summary": summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error summarizing project: {str(e)}")


@router.post("/analyze-projects")
async def analyze_projects(
    analysis_type: str = Query("general", description="Type of analysis: general, comparison, trends, risk, performance"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Analyze all projects and provide insights.

    Args:
        analysis_type: Type of analysis to perform

    Returns:
        AI-generated analysis
    """
    try:
        # Get all projects
        query = select(SponsoredProject)
        result = await db.execute(query)
        projects = result.scalars().all()

        if not projects:
            raise HTTPException(status_code=404, detail="No projects found")

        # Convert projects to dictionaries
        projects_data = [
            {
                "id": p.id,
                "name": p.name,
                "budget": p.budget,
                "status": p.status,
                "sponsor": p.sponsor,
            }
            for p in projects
        ]

        # Perform analysis
        service = get_langchain_service()
        analysis = service.analyze_entities(projects_data, analysis_type)

        return {
            "success": True,
            "analysis_type": analysis_type,
            "projects_count": len(projects),
            "analysis": analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing projects: {str(e)}")


@router.get("/generate-report/{project_id}")
async def generate_report(
    project_id: int,
    report_type: str = Query("detailed", description="Type of report: summary, detailed, technical"),
    db: AsyncSession = Depends(get_async_session),
):
    """
    Generate an AI report for a project.

    Args:
        project_id: ID of the project
        report_type: Type of report to generate

    Returns:
        AI-generated report
    """
    try:
        # Get project from database
        query = select(SponsoredProject).where(SponsoredProject.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Convert project to dictionary
        project_data = {
            "id": project.id,
            "project_id": project.project_id,
            "name": project.name,
            "description": project.description,
            "sponsor": project.sponsor,
            "budget": project.budget,
            "status": project.status,
            "chain": project.chain,
            "entity_key": project.entity_key,
            "polkadot_smart_contract": project.polkadot_smart_contract,
        }

        # Generate report
        service = get_langchain_service()
        report = service.generate_report(project_data, report_type)

        return {
            "success": True,
            "project_id": project_id,
            "project_name": project.name,
            "report_type": report_type,
            "report": report,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
