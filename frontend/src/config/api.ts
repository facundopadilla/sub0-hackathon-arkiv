export const API_BASE = "http://localhost:8000";
export const API_VERSION = "v1";
export const API_PREFIX = `${API_BASE}/api/${API_VERSION}/arkiv`;

// =====================
// Projects API
// =====================
export const projectsAPI = {
  list: () => `${API_PREFIX}/projects`,
  get: (id: number) => `${API_PREFIX}/projects/${id}`,
  create: () => `${API_PREFIX}/projects`,
  update: (id: number) => `${API_PREFIX}/projects/${id}`,
  delete: (id: number) => `${API_PREFIX}/projects/${id}`,
};

// =====================
// Milestones API
// =====================
export const milestonesAPI = {
  list: () => `${API_PREFIX}/milestones`,
  get: (id: number) => `${API_PREFIX}/milestones/${id}`,
  byProject: (projectId: string) => `${API_PREFIX}/milestones/by-project/${projectId}`,
  create: () => `${API_PREFIX}/milestones`,
  update: (id: number) => `${API_PREFIX}/milestones/${id}`,
  delete: (id: number) => `${API_PREFIX}/milestones/${id}`,
};

// =====================
// Sponsored Projects API (Database)
// =====================
export const sponsoredAPI = {
  list: () => `${API_PREFIX}/sponsored`,
  listByStatus: (status: string) => `${API_PREFIX}/sponsored?status_filter=${status}`,
  get: (id: number) => `${API_PREFIX}/sponsored/${id}`,
  byStatus: (status: string) => `${API_PREFIX}/sponsored?status_filter=${status}`,
  create: () => `${API_PREFIX}/sponsored`,
  update: (id: number) => `${API_PREFIX}/sponsored/${id}`,
  delete: (id: number) => `${API_PREFIX}/sponsored/${id}`,
};

// =====================
// Arkiv Blockchain API
// =====================
export const arkivAPI = {
  sponsor: () => `${API_PREFIX}/sponsor`,
  listFromChain: () => `${API_PREFIX}/sponsored`,
  evaluate: (projectId: number) => `${API_PREFIX}/evaluate?project_id=${projectId}`,
  deployEscrow: () => `${API_PREFIX}/escrow/deploy-escrow`,
  getEscrowInfo: (projectId: number) => `${API_PREFIX}/escrow/escrow-info/${projectId}`,
};

// =====================
// API Request Helper
// =====================
export async function apiCall<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: string,
  data?: unknown
): Promise<T> {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// =====================
// Convenience Methods
// =====================
export const api = {
  // Projects
  getProjects: () => apiCall<any[]>("GET", projectsAPI.list()),
  getProject: (id: number) => apiCall<any>("GET", projectsAPI.get(id)),
  createProject: (data: any) => apiCall<any>("POST", projectsAPI.create(), data),
  updateProject: (id: number, data: any) => apiCall<any>("PUT", projectsAPI.update(id), data),
  deleteProject: (id: number) => apiCall<any>("DELETE", projectsAPI.delete(id)),

  // Milestones
  getMilestones: () => apiCall<any[]>("GET", milestonesAPI.list()),
  getMilestone: (id: number) => apiCall<any>("GET", milestonesAPI.get(id)),
  getMilestonesByProject: (projectId: string) => apiCall<any[]>("GET", milestonesAPI.byProject(projectId)),
  createMilestone: (data: any) => apiCall<any>("POST", milestonesAPI.create(), data),
  updateMilestone: (id: number, data: any) => apiCall<any>("PUT", milestonesAPI.update(id), data),
  deleteMilestone: (id: number) => apiCall<any>("DELETE", milestonesAPI.delete(id)),

  // Sponsored Projects (DB)
  getSponsored: () => apiCall<any[]>("GET", sponsoredAPI.list()),
  getSponsoredById: (id: number) => apiCall<any>("GET", sponsoredAPI.get(id)),
  getSponsoredByStatus: (status: string) => apiCall<any[]>("GET", sponsoredAPI.byStatus(status)),
  createSponsored: (data: any) => apiCall<any>("POST", sponsoredAPI.create(), data),
  updateSponsored: (id: number, data: any) => apiCall<any>("PUT", sponsoredAPI.update(id), data),
  deleteSponsored: (id: number) => apiCall<any>("DELETE", sponsoredAPI.delete(id)),

  // Arkiv Blockchain
  saveToArkiv: (data: any) => apiCall<any>("POST", arkivAPI.sponsor(), data),
  getFromArkiv: () => apiCall<any>("GET", arkivAPI.listFromChain()),
  evaluateProject: (projectId: number) => apiCall<any>("POST", arkivAPI.evaluate(projectId)),
};
