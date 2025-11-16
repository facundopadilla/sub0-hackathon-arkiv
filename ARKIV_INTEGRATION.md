# Arkiv Integration Documentation

## Overview

This project integrates **Arkiv** blockchain storage with a FastAPI backend for managing projects, milestones, and sponsored projects with AI evaluation.

## Architecture

### Database Layer

- **PostgreSQL** (Neon cloud) via asyncpg driver
- **SQLModel** ORM with async/await support
- Tables: `project`, `milestone`, `sponsoredproject`

### Blockchain Layer

- **Arkiv SDK** for decentralized entity storage
- Stores sponsored projects as on-chain entities
- Uses RPC endpoint: `https://mendoza.hoodi.arkiv.network/rpc`

### API Endpoints

#### Projects CRUD

```
GET    /api/v1/arkiv/projects          - List all projects
GET    /api/v1/arkiv/projects/{id}     - Get project by ID
POST   /api/v1/arkiv/projects          - Create project
PUT    /api/v1/arkiv/projects/{id}     - Update project
DELETE /api/v1/arkiv/projects/{id}     - Delete project
```

#### Milestones CRUD

```
GET    /api/v1/arkiv/milestones        - List all milestones
GET    /api/v1/arkiv/milestones/by-project/{project_id}
POST   /api/v1/arkiv/milestones        - Create milestone
PUT    /api/v1/arkiv/milestones/{id}   - Update milestone
DELETE /api/v1/arkiv/milestones/{id}   - Delete milestone
```

#### Sponsored Projects CRUD (Database)

```
GET    /api/v1/arkiv/sponsored         - List from database
GET    /api/v1/arkiv/sponsored/{id}    - Get by ID
POST   /api/v1/arkiv/sponsored         - Create
PUT    /api/v1/arkiv/sponsored/{id}    - Update
DELETE /api/v1/arkiv/sponsored/{id}    - Delete
```

#### Arkiv Blockchain Integration

```
POST   /api/v1/arkiv/sponsor           - Save project to Arkiv blockchain
GET    /api/v1/arkiv/arkiv-sponsored   - Arkiv integration info
```

## Key Components

### Services

#### `ProjectService` (`src/services/project.py`)

- Async CRUD operations for projects
- Pattern: `session.execute()` → `.scalar_one_or_none()` / `.scalars().all()`

#### `MilestoneService` (`src/services/milestone.py`)

- Async CRUD with project filtering
- `list_by_project()` method for querying by project_id

#### `SponsoredProjectService` (`src/services/sponsor.py`)

- Async CRUD for database-stored sponsored projects
- `list_by_status()` for status-based queries

#### `ArkivService` (`src/services/arkiv.py`)

- `save_sponsored_project()` - Writes to Arkiv blockchain
- `list_sponsored_projects()` - Reads from blockchain (info endpoint only)

### Models

#### Database Tables (`src/models/`)

- **Project**: `id, created_at, updated_at, project_id (unique), name, repo, description, budget`
- **Milestone**: `id, created_at, updated_at, project_id (FK), name, description, amount`
- **SponsoredProject**: `id, created_at, updated_at, project_id, name, repo, ai_score, status, contract_address, chain, budget, description, _entity_key`

### Configuration

#### Settings (`src/settings/arkiv.py`)

```python
PRIVATE_KEY: SecretStr       # Blockchain private key
HTTP_PROVIDER: str           # RPC endpoint
PRIVATE_NAME: str            # Account name
```

## Workflow Example

### 1. Create Project

```bash
POST /api/v1/arkiv/projects
{
  "project_id": "demo-project",
  "name": "Demo Project",
  "repo": "https://github.com/demo/project",
  "description": "Test",
  "budget": 100000.0
}
```

### 2. Add Milestones

```bash
POST /api/v1/arkiv/milestones
{
  "project_id": "demo-project",
  "name": "M1: Initial",
  "description": "First milestone",
  "amount": 25000.0
}
```

### 3. Save to Arkiv Blockchain

```bash
POST /api/v1/arkiv/sponsor
{
  "project": {
    "project_id": "demo-project",
    "name": "Demo Project",
    "repo": "https://github.com/demo/project",
    "budget": 100000.0
  },
  "ai_score": 8.5,
  "decision": "approved",
  "contract_address": "0x..."
}
```

Response:

```json
{
  "entity_key": "0x...",
  "status": "stored"
}
```

## Environment Variables

```
PRIVATE_KEY=0x...                              # Blockchain private key
DATABASE_URL=postgresql+asyncpg://...         # PostgreSQL connection
HTTP_PROVIDER=https://mendoza.hoodi.arkiv...  # Arkiv RPC
PRIVATE_NAME=your-account                     # Account identifier
```

## Async/Await Pattern

All database operations follow SQLAlchemy 2.0+ async pattern:

```python
async def get_by_id(self, session: AsyncSession, id: int):
    stmt = select(Project).where(Project.id == id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()
```

## Error Handling

- Arkiv blockchain saves work correctly
- Arkiv blockchain queries require custom implementation
- Database stores all data redundantly for reliability
- All endpoints validate input with Pydantic schemas

## Testing

```python
import requests

# Test blockchain save
response = requests.post("http://localhost:8000/api/v1/arkiv/sponsor", json=sponsor_data)
print(response.json()['entity_key'])  # Returns blockchain entity key

# Test database list
response = requests.get("http://localhost:8000/api/v1/arkiv/sponsored")
print(len(response.json()))  # Returns database items
```

## Current Status

✅ Projects CRUD - Working
✅ Milestones CRUD - Working
✅ Sponsored Projects CRUD (DB) - Working
✅ Arkiv Blockchain Save - Working
✅ Database Storage - Working
ℹ️ Arkiv Blockchain Query - Use SDK directly with RPC endpoint

## Next Steps

1. Implement `query_entities()` with proper Arkiv SDK
2. Add caching layer for blockchain reads
3. Add event watching for real-time updates
4. Implement cost estimation for storage
