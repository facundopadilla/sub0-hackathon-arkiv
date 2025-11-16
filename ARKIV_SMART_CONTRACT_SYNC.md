# Arkiv Entity Update on Smart Contract Deployment

## Feature Overview
Cuando un smart contract se despliega exitosamente en Rococo, la entidad correspondiente en Arkiv se actualiza automáticamente con el hash del contrato (address) en un nuevo campo llamado `polkadot_smart_contract`.

## Architecture

### Data Flow
```
Frontend: Click "Lanzar Proyecto"
    ↓
POST /api/v1/arkiv/escrow/deploy-escrow
    ↓
RococoDeployer: Deploy contract to Rococo
    ↓
contract_address = "5HpG9w8..."
    ↓
Save to SponsoredProject.polkadot_smart_contract in DB
    ↓
ArkivService.update_entity_with_contract()
    ↓
Update Arkiv entity with new field
    ↓
Arkiv blockchain updated with contract hash
```

### Implementation Details

#### 1. New Method in ArkivService
**File:** `src/services/arkiv.py`

```python
def update_entity_with_contract(
    client: Arkiv, 
    entity_key: str, 
    contract_address: str
) -> bool:
    """
    Update a sponsored project entity in Arkiv with the smart contract address.
    """
    # Retrieve current entity
    entity = client.arkiv.get_entity(entity_key)
    
    # Add polkadot_smart_contract to payload
    data["polkadot_smart_contract"] = contract_address
    
    # Update Arkiv entity
    client.arkiv.update_entity(
        entity_key=entity_key,
        payload=updated_payload,
        attributes=attrs  # Including polkadotSmartContract
    )
```

#### 2. Enhanced deploy_escrow Endpoint
**File:** `src/routes/v1/escrow.py`

```python
@router.post("/deploy-escrow")
async def deploy_escrow(
    project_id: int,
    db: AsyncSession = Depends(get_async_session),
    arkiv_client: Arkiv = Depends(get_arkiv_client),  # NEW: Arkiv client
):
    # ... deploy contract ...
    contract_address = deployment_result.get("contract_address")
    
    # Save to DB
    project.polkadot_smart_contract = contract_address
    await db.commit()
    
    # NEW: Update Arkiv entity
    if project.entity_key:
        ArkivService.update_entity_with_contract(
            client=arkiv_client,
            entity_key=project.entity_key,
            contract_address=contract_address
        )
```

#### 3. Database Schema
**File:** `src/models/sponsor.py`

```python
class SponsoredProject(BaseTable, table=True):
    # ... existing fields ...
    entity_key: Optional[str] = None           # Arkiv entity ID
    tx_hash: Optional[str] = None              # Arkiv transaction hash
    polkadot_smart_contract: Optional[str] = None  # NEW: SC address hash
```

## Data Storage

### Database (PostgreSQL)
```
sponsoredproject table:
┌─────────────────────────────────────────────────────────────┐
│ id | project_id | name | ... | entity_key | tx_hash | SC*  │
├─────────────────────────────────────────────────────────────┤
│ 1  | proj_001   | ...  | ... | 0x1234...  | 0x5678  | 0x9..│
└─────────────────────────────────────────────────────────────┘
      * polkadot_smart_contract
```

### Arkiv Blockchain
```json
{
  "type": "sponsored_project",
  "project_id": "proj_001",
  "name": "Project Name",
  "budget": 50000,
  "polkadot_smart_contract": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGo81mwA7ujVMCSDaJ",
  "status": "approved"
}
```

## API Response

### Before (Old)
```json
{
  "success": true,
  "project_id": 1,
  "contract_address": "5HpG9w8...",
  "milestones": 4,
  "message": "Escrow contract deployed successfully"
}
```

### After (New)
```json
{
  "success": true,
  "project_id": 1,
  "contract_address": "5HpG9w8...",
  "polkadot_smart_contract": "5HpG9w8...",
  "milestones": 4,
  "arkiv_updated": true,
  "message": "Escrow contract deployed successfully"
}
```

## Field Definition

### polkadot_smart_contract Field

| Property | Value |
|----------|-------|
| Type | `Optional[str]` |
| Database | `VARCHAR` |
| Location | Arkiv entity payload |
| Format | Substrate contract address (SS58 encoded) |
| Example | `5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGo81mwA7ujVMCSDaJ` |
| Arkiv Attribute | `polkadotSmartContract` |

## Error Handling

### Scenario 1: Deployment Success, Arkiv Update Fails
```python
# Contract deployed but Arkiv update failed
return {
    "success": true,
    "contract_address": "5HpG9w8...",
    "arkiv_updated": false,
    "message": "Contract deployed but Arkiv update failed"
}
```
✅ **Result**: Contract is in Rococo, DB is updated, Arkiv is out of sync  
⚠️ **Action**: Manual Arkiv update might be needed

### Scenario 2: No entity_key (Project Not in Arkiv)
```python
# Project was sponsored locally but not via Arkiv POST
if not project.entity_key:
    print("⚠️  No entity_key found, skipping Arkiv update")
```
✅ **Result**: Contract still deployed, only DB is updated

## Updated Fields Summary

### In SponsoredProject Model
```python
entity_key: Optional[str] = None              # Arkiv entity ID (hash)
tx_hash: Optional[str] = None                 # Arkiv transaction ID (hash)
polkadot_smart_contract: Optional[str] = None # Smart contract address
```

### In Arkiv Attributes
```python
Attributes({
    "type": "sponsored_project",
    "projectId": data["project_id"],
    "status": data["status"],
    "aiScore": str(data.get("ai_score", "")),
    "contractAddress": data.get("contract_address", ""),
    "chain": data.get("chain", "asset_hub"),
    "polkadotSmartContract": contract_address,  # NEW ATTRIBUTE
})
```

## Workflow Example

### Step 1: User Creates Sponsored Project
```bash
POST /api/v1/arkiv/sponsor
{
  "project": {...},
  "ai_score": 8.5,
  "contract_address": "asset_hub_account_123"
}

Response:
{
  "entity_key": "0xabcd1234...",
  "tx_hash": "0xefgh5678...",
  "status": "stored"
}
```
**Result**: Entity created in Arkiv with entity_key stored in DB

### Step 2: User Deploys Smart Contract
```bash
POST /api/v1/arkiv/escrow/deploy-escrow?project_id=1

Response:
{
  "success": true,
  "contract_address": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGo81mwA7ujVMCSDaJ",
  "polkadot_smart_contract": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGo81mwA7ujVMCSDaJ",
  "arkiv_updated": true
}
```
**Result**: 
- Contract deployed to Rococo
- DB updated with `polkadot_smart_contract`
- Arkiv entity updated with contract address
- Bidirectional sync complete

### Step 3: Query Project
```bash
GET /api/v1/arkiv/arkiv-sponsored?status=approved

Response:
[{
  "project_id": "proj_001",
  "name": "Project Name",
  "entity_key": "0xabcd1234...",
  "tx_hash": "0xefgh5678...",
  "polkadot_smart_contract": "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGo81mwA7ujVMCSDaJ",
  "status": "approved"
}]
```
**Result**: Complete blockchain data + smart contract hash available

## Files Modified

| File | Changes |
|------|---------|
| `src/services/arkiv.py` | Added `update_entity_with_contract()` method |
| `src/routes/v1/escrow.py` | Updated `deploy_escrow()` to call Arkiv update |
| `src/models/sponsor.py` | Added `polkadot_smart_contract` field to all classes |
| `reset_db.py` | Database reset (schema updated) |

## Commit
```
96fe82e 🔗 Add Arkiv entity update on smart contract deployment
```

## Benefits

✅ **Complete Blockchain Audit Trail**
- Arkiv stores the contract address
- Database mirrors Arkiv state
- Full traceability from project → Arkiv → Smart contract

✅ **Data Integrity**
- Both systems stay synchronized
- No orphaned contracts
- Easy to track which contract belongs to which project

✅ **Developer Experience**
- Single endpoint returns all hashes
- No need to query multiple systems
- Clear error messages for failures

✅ **Auditability**
- Can retrieve by entity_key, tx_hash, or contract_address
- Multiple query paths available
- Complete history preserved in Arkiv

## Future Enhancements

- [ ] Automatic retry logic if Arkiv update fails
- [ ] Webhook notifications when contract deploys
- [ ] Query Arkiv by contract_address
- [ ] Contract state synchronization back to Arkiv
- [ ] Milestone release events → Arkiv updates
