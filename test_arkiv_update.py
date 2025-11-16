#!/usr/bin/env python3
"""
Test script to verify Arkiv entity update flow
This simulates the complete flow: Create project -> Create Arkiv entity -> Deploy SC -> Update Arkiv
"""
import asyncio
import json
import sys
sys.path.insert(0, '/Users/facundo/Proyectos-VSC/Sub0_data')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from src.models.sponsor import SponsoredProject
from src.services.arkiv import ArkivService
from src.settings.config import DATABASE_URL
from arkiv import Arkiv

# Import environment
import os
from dotenv import load_dotenv
load_dotenv()


async def test_arkiv_update_flow():
    """Test the complete Arkiv entity update flow"""
    
    print("\n" + "="*80)
    print("🧪 ARKIV ENTITY UPDATE TEST")
    print("="*80)
    
    # Setup database
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            
            # Step 1: Get existing project with entity_key
            print("\n📋 Step 1: Fetching project with entity_key...")
            query = select(SponsoredProject).where(
                SponsoredProject.entity_key.isnot(None)
            ).limit(1)
            result = await session.execute(query)
            project = result.scalars().first()
            
            if not project:
                print("❌ No projects with entity_key found")
                # Try to create one for testing
                print("\n📝 Creating test project...")
                project = SponsoredProject(
                    project_id="test_project_123",
                    name="Test Project",
                    description="Test project for Arkiv update",
                    sponsor="Test Sponsor",
                    budget=1000.0,
                    status="approved",
                    chain="asset_hub",
                    entity_key=None,
                    tx_hash=None,
                    polkadot_smart_contract=None
                )
                session.add(project)
                await session.commit()
                print(f"✅ Test project created with ID: {project.id}")
            else:
                print(f"✅ Found project: {project.name} (ID: {project.id})")
                print(f"   Entity Key: {project.entity_key}")
                print(f"   TX Hash: {project.tx_hash}")
                print(f"   Smart Contract: {project.polkadot_smart_contract}")
            
            # Step 2: If no entity_key, create one in Arkiv
            if not project.entity_key:
                print("\n📡 Step 2: Creating Arkiv entity...")
                
                # Initialize Arkiv client
                from src.core.depends.arkiv import get_arkiv_client
                arkiv_client = await get_arkiv_client()
                
                result = await ArkivService.save_sponsored_project(
                    client=arkiv_client,
                    project=project
                )
                
                if result:
                    project.entity_key = result.get("entity_key")
                    project.tx_hash = result.get("tx_hash")
                    await session.commit()
                    print(f"✅ Arkiv entity created")
                    print(f"   Entity Key: {project.entity_key}")
                    print(f"   TX Hash: {project.tx_hash}")
                else:
                    print("❌ Failed to create Arkiv entity")
                    return
            
            # Step 3: Update entity with smart contract address
            print("\n🔗 Step 3: Updating Arkiv entity with smart contract address...")
            
            # Initialize Arkiv client
            from src.core.depends.arkiv import get_arkiv_client
            arkiv_client = await get_arkiv_client()
            
            # Simulate a contract address (in real scenario this comes from deployment)
            test_contract_address = "5HpG9w8wBKZgfjjfHmU5rN7v5DzTK1qLKjG9GhC2cGfD"
            
            print(f"   Using test contract address: {test_contract_address}")
            print(f"   Entity Key: {project.entity_key}")
            
            # Call the update method
            update_success = ArkivService.update_entity_with_contract(
                client=arkiv_client,
                entity_key=project.entity_key,
                contract_address=test_contract_address
            )
            
            if update_success:
                print(f"✅ Arkiv entity updated successfully!")
                project.polkadot_smart_contract = test_contract_address
                await session.commit()
                
                # Step 4: Verify the update
                print("\n✅ Step 4: Verifying Arkiv entity update...")
                
                # Query the entity from Arkiv to verify
                try:
                    entity = arkiv_client.arkiv.get_entity(project.entity_key)
                    if entity:
                        payload = json.loads(entity.payload.decode("utf-8"))
                        print(f"   Payload keys: {list(payload.keys())}")
                        if "polkadot_smart_contract" in payload:
                            print(f"   ✅ polkadot_smart_contract field found: {payload['polkadot_smart_contract']}")
                        else:
                            print(f"   ⚠️  polkadot_smart_contract field NOT found in payload")
                            print(f"   Current payload: {json.dumps(payload, indent=2)}")
                    else:
                        print(f"   ⚠️  Could not retrieve entity from Arkiv")
                except Exception as verify_error:
                    print(f"   ⚠️  Error verifying entity: {str(verify_error)}")
                
                print("\n✅ TEST PASSED: Arkiv entity updated with smart contract!")
                
            else:
                print(f"❌ Failed to update Arkiv entity")
                print("\n⚠️  TEST FAILED: Could not update Arkiv entity")
    
    except Exception as e:
        print(f"\n❌ TEST ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        await engine.dispose()
        print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    asyncio.run(test_arkiv_update_flow())
