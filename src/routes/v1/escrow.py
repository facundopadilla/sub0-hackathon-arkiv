"""
Escrow Routes - Progressive Fund Release for Projects
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.depends.db import get_async_session
from src.models.sponsor import SponsoredProject

router = APIRouter(prefix="/escrow", tags=["escrow"])


@router.post("/deploy-escrow")
async def deploy_escrow(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Deploy an escrow smart contract for a project with progressive fund release
    
    - Takes an approved project
    - Creates milestones based on project timeline
    - Initializes the escrow contract
    - Saves the contract address to the project
    
    Args:
        project_id: ID of the project to create escrow for
        
    Returns:
        dict with contract_address and deployment details
    """
    try:
        # Get the project using async query
        from sqlalchemy import select
        query = select(SponsoredProject).where(SponsoredProject.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Verify project is approved
        if project.status != "approved":
            raise HTTPException(
                status_code=400,
                detail=f"Project must be approved to create escrow. Current status: {project.status}"
            )
        
        # If project already has a contract, we can update it (re-launch)
        # This allows relaunching if the previous one failed
        is_relaunch = bool(project.contract_address)
        
        # TODO: In production, this would:
        # 1. Connect to Rococo Contracts testnet via substrate-interface
        # 2. Deploy the funding-escrow contract from WASM
        # 3. Call create_escrow() with milestones
        # 4. Return the contract address
        
        # For now, simulate the deployment
        # In a real implementation, use polkadot-js or substrate SDK
        
        milestone_percentages = [25, 25, 25, 25]  # 4 equal phases
        milestone_descriptions = [
            "Phase 1: Initial Setup and Planning",
            "Phase 2: Development and Testing",
            "Phase 3: Integration and Optimization",
            "Phase 4: Final Delivery and Handover"
        ]
        
        # TODO: Actual contract deployment would happen here
        # contract_address = await deploy_to_rococo(
        #     project_id=project.project_id,
        #     project_name=project.name,
        #     budget=project.budget,
        #     milestones=milestone_percentages,
        #     descriptions=milestone_descriptions
        # )
        
        # Placeholder contract address (in production, this comes from blockchain)
        contract_address = f"5{project.project_id[:40]}"  # Simulated address
        
        # Update project with contract address
        project.contract_address = contract_address
        project.status = "approved"  # Keep as approved since contract is deployed
        await db.commit()
        
        return {
            "success": True,
            "project_id": project_id,
            "contract_address": contract_address,
            "milestones": len(milestone_percentages),
            "message": f"Escrow contract {'re-launched' if is_relaunch else 'deployed'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deploying escrow: {str(e)}"
        )


@router.get("/escrow-info/{project_id}")
async def get_escrow_info(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
):
    """
    Get information about a project's escrow contract
    
    Args:
        project_id: ID of the project
        
    Returns:
        dict with escrow and milestone information
    """
    try:
        from sqlalchemy import select
        query = select(SponsoredProject).where(SponsoredProject.id == project_id)
        result = await db.execute(query)
        project = result.scalars().first()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        if not project.contract_address:
            raise HTTPException(
                status_code=404,
                detail="Project does not have an escrow contract"
            )
        
        # TODO: In production, query the contract state from Rococo
        # For now, return placeholder info
        
        return {
            "project_id": project_id,
            "project_name": project.name,
            "contract_address": project.contract_address,
            "budget": project.budget,
            "chain": project.chain,
            "status": "deployed",
            "milestones": [
                {"index": 0, "percentage": 25, "released": False},
                {"index": 1, "percentage": 25, "released": False},
                {"index": 2, "percentage": 25, "released": False},
                {"index": 3, "percentage": 25, "released": False},
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching escrow info: {str(e)}"
        )
