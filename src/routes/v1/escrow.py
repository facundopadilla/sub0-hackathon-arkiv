"""
Escrow Routes - Progressive Fund Release for Projects
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.depends.db import get_async_session
from src.core.depends.arkiv import get_arkiv_client
from src.models.sponsor import SponsoredProject
from src.services.rococo_deployer import RococoDeployer
from src.services.arkiv import ArkivService
from arkiv import Arkiv

router = APIRouter(prefix="/escrow", tags=["escrow"])


@router.post("/deploy-escrow")
async def deploy_escrow(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
    arkiv_client: Arkiv = Depends(get_arkiv_client),
):
    """
    Deploy an escrow smart contract for a project with progressive fund release
    
    - Takes an approved project
    - Creates milestones based on project timeline
    - Initializes the escrow contract
    - Saves the contract address to the project
    - Updates the Arkiv entity with the contract address
    
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
        
        # Deploy to Rococo Testnet
        deployer = RococoDeployer()
        
        # Connect to Rococo
        if not await deployer.connect():
            raise HTTPException(
                status_code=503,
                detail="Could not connect to Rococo testnet. Try again later."
            )
        
        # Prepare milestones
        milestone_count = 4
        total_amount = int(project.budget * 10**12)  # Convert to smallest unit (planck)
        
        # Deploy the contract using real WASM and metadata
        deployment_result = await deployer.deploy_contract(
            project_owner=project.project_id,
            milestone_count=milestone_count,
            total_amount=total_amount,
            keypair_uri=None,  # In production, load from secure storage
        )
        
        if not deployment_result:
            raise HTTPException(
                status_code=500,
                detail="Failed to deploy contract to Rococo"
            )
        
        contract_address = deployment_result.get("contract_address")
        project.status = "approved"  # Keep as approved since contract is deployed
        project.polkadot_smart_contract = contract_address  # Store the contract address
        await db.commit()
        
        # Update the Arkiv entity with the smart contract address
        if project.entity_key:
            update_success = ArkivService.update_entity_with_contract(
                client=arkiv_client,
                entity_key=project.entity_key,
                contract_address=contract_address
            )
            
            if update_success:
                print(f"✅ Arkiv entity updated with contract: {contract_address}")
            else:
                print(f"⚠️  Failed to update Arkiv entity, but contract deployed: {contract_address}")
        else:
            print(f"⚠️  No entity_key found, skipping Arkiv update")
        
        return {
            "success": True,
            "project_id": project_id,
            "contract_address": contract_address,
            "polkadot_smart_contract": contract_address,
            "milestones": milestone_count,
            "arkiv_updated": bool(project.entity_key),
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
