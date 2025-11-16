# ⚡ Quick Start Guide - Frontend + Backend

## 🚀 Start Everything in 2 Steps

### Step 1: Start Backend

```bash
cd /Users/facundo/Proyectos-VSC/Sub0_data
source .venv/bin/activate
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

**You should see:**

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

**You should see:**

```
VITE v5.4.21  ready in ... ms

➜  Local:   http://localhost:5173/
```

---

## 🎯 Test the Integration

### 1. Submit a Project (SubmitProjectForm)

1. Open `http://localhost:5173` in browser
2. Click **"Enviar Proyecto"**
3. Fill in the form:
   - Project ID: `test-001`
   - Name: `My Test Project`
   - Repository: `https://github.com/test/project`
   - Budget: `10000`
   - Add at least 1 milestone
4. Click **"Enviar a Evaluación"**
5. **Expected**: Success notification with Arkiv entity key

### 2. View Projects (ProjectsListView)

1. Click **"Proyectos en Arkiv"** tab
2. **Expected**: Your submitted project appears in the list
3. Verify: AI score (75%), budget ($10,000), chain, repo link

### 3. Review Pending (ModerationView)

1. Click **"Moderación"** tab
2. **Expected**: Your project appears in the pending list
3. Click on the project to see details
4. Click **"✅ Aprobar Proyecto"**
5. **Expected**: Project status changes to "approved" and disappears from pending

---

## 📱 API Endpoints Used

### Projects

```
POST   /api/v1/arkiv/projects           → Create project
GET    /api/v1/arkiv/projects           → List all projects
GET    /api/v1/arkiv/projects/{id}      → Get project by ID
PUT    /api/v1/arkiv/projects/{id}      → Update project
DELETE /api/v1/arkiv/projects/{id}      → Delete project
```

### Milestones

```
POST   /api/v1/arkiv/milestones         → Create milestone
GET    /api/v1/arkiv/milestones         → List all milestones
GET    /api/v1/arkiv/milestones?project_id=... → By project
PUT    /api/v1/arkiv/milestones/{id}    → Update milestone
DELETE /api/v1/arkiv/milestones/{id}    → Delete milestone
```

### Sponsored Projects (Database)

```
POST   /api/v1/arkiv/sponsored          → Create sponsored project
GET    /api/v1/arkiv/sponsored          → List all
GET    /api/v1/arkiv/sponsored?status=submitted → By status
PUT    /api/v1/arkiv/sponsored/{id}     → Update status
DELETE /api/v1/arkiv/sponsored/{id}     → Delete
```

### Arkiv Blockchain

```
POST   /api/v1/arkiv/sponsor            → Save to Arkiv blockchain
GET    /api/v1/arkiv/arkiv-sponsored    → Get from Arkiv blockchain
```

---

## 📂 Key Files

### Frontend Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── api.ts              ← All API endpoints
│   ├── services/
│   │   └── projectService.ts   ← All CRUD operations
│   └── components/
│       └── FundingOracle/
│           ├── SubmitProjectForm.tsx   ← Submit projects
│           ├── ProjectsListView.tsx    ← View projects
│           └── ModerationView.tsx      ← Review projects
└── package.json
```

### Backend Structure

```
src/
├── main.py                 ← FastAPI app
├── core/depends/
│   ├── arkiv.py           ← Arkiv client
│   └── db.py              ← Database session
├── models/                ← SQLModel definitions
├── schemas/               ← Request/response schemas
├── services/              ← Business logic
├── routes/v1/arkiv.py     ← 19 CRUD endpoints
└── settings/              ← Configuration
```

---

## 🧪 Using ProjectService (in Components)

### Import

```typescript
import { ProjectService } from "../../services/projectService";
```

### Create Project

```typescript
const project = await ProjectService.createProject({
  project_id: "my-proj",
  name: "My Project",
  repo: "https://github.com/user/repo",
  budget: 10000,
});
```

### Get Projects

```typescript
const projects = await ProjectService.getProjects();
```

### Get Pending for Moderation

```typescript
const pending = await ProjectService.getSponsoredByStatus("submitted");
```

### Approve a Project

```typescript
await ProjectService.updateSponsored(id, { status: "approved" });
```

### Save to Arkiv Blockchain

```typescript
const result = await ProjectService.saveToArkiv({
  project: projectData,
  ai_score: 8.5,
  decision: "approved",
  contract_address: "0x...",
});
// Returns: { entity_key: "0x..." }
```

### Submit Complete Project

```typescript
const result = await ProjectService.submitProject(
  projectData, // Project object
  milestonesData, // Array of milestones
  7.5, // AI Score
  "submitted" // Decision
);
```

---

## 🔍 Debugging

### Check Backend Health

```bash
curl http://localhost:8000/healthcheck
```

### View API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Check Frontend Console

```
Open DevTools: Cmd + Option + I
Go to Console tab
Submit project to see API calls
```

### Check Backend Logs

```
Look at terminal running: python -m uvicorn ...
All requests will be logged there
```

---

## ❌ Troubleshooting

### Frontend shows "Cannot GET /"

**Problem**: Frontend dev server not started  
**Solution**: Run `npm run dev` in frontend folder

### "Failed to fetch from backend"

**Problem**: Backend not running  
**Solution**:

```bash
cd /Users/facundo/Proyectos-VSC/Sub0_data
source .venv/bin/activate
python -m uvicorn src.main:app --reload
```

### CORS Error in Console

**Problem**: Frontend trying to reach wrong URL  
**Solution**: Check `API_BASE` in `frontend/src/config/api.ts` matches backend URL

### No projects showing in list

**Problem**: Database is empty  
**Solution**: Submit a project first via the form

### Linting errors in IDE

**Problem**: Tailwind CSS class suggestions  
**Solution**: Ignore - these are just suggestions, not errors

---

## 📊 Data Flow Example

### Submitting a Project

```
User fills form
  ↓ (Click Submit)
SubmitProjectForm.tsx
  ↓
ProjectService.submitProject(data)
  ↓
api.createProject() → POST /api/v1/arkiv/projects
  ↓ (Backend creates project)
api.createMilestone() → POST /api/v1/arkiv/milestones
  ↓ (Backend creates milestones)
api.saveToArkiv() → POST /api/v1/arkiv/sponsor
  ↓ (Backend saves to Arkiv blockchain)
Returns: { arkivEntity: { entity_key: "0x..." } }
  ↓
Show notification with entity key
  ↓
Clear form
```

---

## 📈 What Gets Created

### When you submit a project:

1. **Project Record** (Database)

   - project_id, name, repo, budget, etc.
   - Stored in PostgreSQL

2. **Milestone Records** (Database)

   - Each milestone linked to project
   - Stored in PostgreSQL

3. **Sponsored Project Record** (Database)

   - Links project to blockchain
   - Stores AI score, status, chain info
   - Stored in PostgreSQL

4. **Arkiv Blockchain Entry**
   - Project data stored on-chain
   - Returns entity_key for reference
   - Stored on Arkiv blockchain (Polkadot)

### Result:

- **Database**: 3 tables with project data
- **Blockchain**: Immutable record in Arkiv
- **UI**: All components show real data from backend

---

## 🎉 You're All Set!

Your full-stack Web3 funding system is now:

- ✅ Connected (Frontend ↔ Backend)
- ✅ Functional (All CRUD operations work)
- ✅ Integrated (Database + Blockchain synced)
- ✅ Ready (Test end-to-end workflow)

**Start testing now!** 🚀
