# 🔌 Frontend + Backend Integration Guide

## Overview
This guide shows how to connect your React/Vite frontend to the FastAPI backend with Arkiv blockchain integration.

---

## 📦 Setup Instructions

### 1. Install Dependencies (Frontend)

```bash
cd frontend
npm install
```

### 2. Environment Configuration

**Frontend** (`frontend/.env` or `frontend/src/config/api.ts`):
```typescript
export const API_BASE = "http://localhost:8000";
```

**Backend** (Already configured):
- Backend runs on: `http://localhost:8000`
- API Base: `/api/v1/arkiv`

### 3. Start Services

**Terminal 1 - Backend**:
```bash
cd /Users/facundo/Proyectos-VSC/Sub0_data
source .venv/bin/activate
python -m uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

Frontend should open at: `http://localhost:5173`

---

## 🔄 API Integration Points

### 1. **SubmitProjectForm Component**

**Location**: `frontend/src/components/FundingOracle/SubmitProjectForm.tsx`

**What it does**:
- Collects project information (name, repo, budget, milestones)
- Submits to backend via `ProjectService`

**API Endpoints Used**:
```
POST /api/v1/arkiv/projects       → Create project
POST /api/v1/arkiv/milestones     → Create milestones
POST /api/v1/arkiv/sponsor        → Save to Arkiv blockchain
```

**Example Flow**:
```javascript
const result = await ProjectService.submitProject(
  projectData,      // Project info
  milestonesData,   // Milestone array
  aiScore,          // AI evaluation score
  decision          // "submitted" | "approved" | "rejected"
);
```

---

### 2. **ModerationView Component**

**Location**: `frontend/src/components/FundingOracle/ModerationView.tsx`

**What it does**:
- Lists pending projects from database
- Allows moderators to approve/reject projects

**Recommended Endpoints**:
```
GET /api/v1/arkiv/sponsored?status=submitted   → Get pending
PUT /api/v1/arkiv/sponsored/{id}               → Update status
```

---

### 3. **ProjectsListView Component**

**Location**: `frontend/src/components/FundingOracle/ProjectsListView.tsx`

**What it does**:
- Displays all projects stored in Arkiv blockchain

**Endpoints Used**:
```
GET /api/v1/arkiv/arkiv-sponsored    → Get all projects from Arkiv
```

---

## 🛠️ Service Usage

### ProjectService Class

Located at: `frontend/src/services/projectService.ts`

#### Project Operations

```typescript
// Create a project
const project = await ProjectService.createProject({
  project_id: "my-project",
  name: "My Project",
  repo: "https://github.com/user/repo",
  description: "Description",
  budget: 10000,
});

// Get all projects
const projects = await ProjectService.getProjects();

// Get specific project
const project = await ProjectService.getProjectById(1);

// Update project
await ProjectService.updateProject(1, {
  name: "Updated Name",
});

// Delete project
await ProjectService.deleteProject(1);
```

#### Milestone Operations

```typescript
// Create milestone
const milestone = await ProjectService.createMilestone({
  project_id: "my-project",
  name: "M1: Setup",
  description: "Initial setup",
  amount: 2500,
});

// Get milestones by project
const milestones = await ProjectService.getMilestonesByProject("my-project");

// Update milestone
await ProjectService.updateMilestone(1, {
  amount: 3000,
});
```

#### Sponsored Projects (Database)

```typescript
// Get all sponsored projects
const sponsored = await ProjectService.getSponsored();

// Get by status
const pending = await ProjectService.getSponsoredByStatus("submitted");

// Create sponsored project
await ProjectService.createSponsoredProject({
  project_id: "my-project",
  name: "My Project",
  repo: "...",
  ai_score: 8.5,
  status: "approved",
  contract_address: "0x...",
  chain: "polkadot",
  budget: 10000,
});
```

#### Arkiv Blockchain

```typescript
// Save to blockchain
const result = await ProjectService.saveToArkiv({
  project: projectData,
  ai_score: 8.5,
  decision: "approved",
  contract_address: "0x...",
});
// Returns: { entity_key: "0x..." }

// Get from blockchain
const projects = await ProjectService.getFromArkiv();
```

#### Submit Complete Project

```typescript
// Submits project + milestones + saves to Arkiv all at once
const result = await ProjectService.submitProject(
  projectData,      // Project object
  milestonesData,   // Array of milestones
  7.5,              // AI Score
  "submitted"       // Decision
);

// Returns: {
//   project: {...},
//   milestones: [...],
//   arkivEntity: { entity_key: "0x..." }
// }
```

---

## 📡 API Configuration

### File: `frontend/src/config/api.ts`

Contains all API endpoints and helper functions:

```typescript
// Base URL configuration
export const API_BASE = "http://localhost:8000";
export const API_PREFIX = `${API_BASE}/api/v1/arkiv`;

// Endpoint objects
export const projectsAPI = { ... }
export const milestonesAPI = { ... }
export const sponsoredAPI = { ... }
export const arkivAPI = { ... }

// Generic API caller
export async function apiCall<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: unknown
): Promise<T>

// Convenience methods
export const api = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  // ... etc
}
```

---

## 🎯 Component Integration Examples

### Example 1: Form with Submit

```typescript
import { ProjectService } from "../../services/projectService";

export const MyForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ProjectData) => {
    setLoading(true);
    try {
      const result = await ProjectService.createProject(data);
      console.log("Project created:", result);
      // Show success notification
    } catch (error) {
      console.error("Error:", error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  return (
    // Form JSX
  );
};
```

### Example 2: Data Fetching

```typescript
import { useEffect, useState } from "react";
import { ProjectService } from "../../services/projectService";

export const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await ProjectService.getProjects();
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {projects.map((p) => (
        <div key={p.id}>{p.name}</div>
      ))}
    </div>
  );
};
```

### Example 3: Blockchain Integration

```typescript
const handleSaveToArkiv = async (projectId: number) => {
  try {
    const project = await ProjectService.getProjectById(projectId);
    const result = await ProjectService.saveToArkiv({
      project,
      ai_score: 8.5,
      decision: "approved",
      contract_address: "0x123...",
    });

    console.log("Saved to Arkiv:", result.entity_key);
  } catch (error) {
    console.error("Error saving to Arkiv:", error);
  }
};
```

---

## 🔍 Testing the Integration

### 1. Test Project Creation

```bash
# Terminal: Test API directly
curl -X POST http://localhost:8000/api/v1/arkiv/projects \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "test-project",
    "name": "Test",
    "repo": "https://github.com/test/project",
    "budget": 10000.0
  }'
```

### 2. Test Frontend Form

1. Open `http://localhost:5173` in browser
2. Click "Enviar Proyecto"
3. Fill out the form
4. Submit
5. Check browser console for the request
6. Check backend logs for processing

### 3. Verify Data Persistence

```bash
# Check if project was saved
curl http://localhost:8000/api/v1/arkiv/projects

# Check if saved to Arkiv
curl http://localhost:8000/api/v1/arkiv/arkiv-sponsored
```

---

## 🚨 Error Handling

### Common Issues

**1. CORS Error**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Add CORS to backend in `src/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. 404 Not Found**
```
POST http://localhost:8000/api/v1/arkiv/projects 404
```
**Solution**: Check backend is running and API endpoints are correct

**3. 500 Internal Server Error**
**Solution**: Check backend console for error details

---

## 📋 Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] API_BASE configured correctly
- [ ] Can submit project via frontend form
- [ ] Project appears in database
- [ ] Milestones created successfully
- [ ] Arkiv blockchain receives data
- [ ] Entity key returned from blockchain

---

## 🔗 Quick Links

- **Backend API Docs**: `http://localhost:8000/docs` (Swagger)
- **Frontend Dev Server**: `http://localhost:5173`
- **Backend Health Check**: `http://localhost:8000/healthcheck`
- **Arkiv Testnet**: `https://mendoza.hoodi.arkiv.network/rpc`

---

## 📝 Next Steps

1. **Update ModerationView**: Implement project moderation UI
2. **Update ProjectsListView**: Fetch and display Arkiv projects
3. **Add Real AI Scoring**: Integrate actual AI scoring logic
4. **Add Authentication**: User login/authentication
5. **Deploy**: Move to production environment

---

## 💡 Tips

- Always use TypeScript types from `projectService.ts`
- Use `ProjectService` methods instead of calling `api` directly
- Add proper error handling in all async operations
- Use notifications/toasts for user feedback
- Check browser console and backend logs for debugging

---

**Backend Status**: ✅ Ready
**Frontend Integration**: ✅ Ready
**Next**: Update remaining components to use the API!
