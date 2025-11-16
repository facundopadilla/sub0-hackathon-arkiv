import { api, apiCall, arkivAPI } from "../config/api";

export interface Project {
  id?: number;
  project_id: string;
  name: string;
  repo: string;
  description?: string;
  budget: number;
  created_at?: string;
  updated_at?: string;
}

export interface Milestone {
  id?: number;
  project_id: string;
  name: string;
  description?: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface SponsoredProject {
  id?: number;
  project_id: string;
  name: string;
  repo: string;
  ai_score: number;
  status: string;
  contract_address: string;
  chain: string;
  budget: number;
  description?: string;
  _entity_key?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvaluationResult {
  ai_score: number;
  decision: string;
  rationale: string;
}

export class ProjectService {
  // ==================
  // Project Operations
  // ==================
  static async createProject(projectData: Project): Promise<Project> {
    const payload = {
      project_id: projectData.project_id,
      name: projectData.name,
      repo: projectData.repo,
      description: projectData.description || "",
      budget: projectData.budget,
    };
    return api.createProject(payload);
  }

  static async getProjects(): Promise<Project[]> {
    return api.getProjects();
  }

  static async getProjectById(id: number): Promise<Project> {
    return api.getProject(id);
  }

  static async updateProject(id: number, data: Partial<Project>): Promise<Project> {
    return api.updateProject(id, data);
  }

  static async deleteProject(id: number): Promise<void> {
    return api.deleteProject(id);
  }

  // ==================
  // Milestone Operations
  // ==================
  static async createMilestone(milestoneData: Milestone): Promise<Milestone> {
    const payload = {
      project_id: milestoneData.project_id,
      name: milestoneData.name,
      description: milestoneData.description || "",
      amount: milestoneData.amount,
    };
    return api.createMilestone(payload);
  }

  static async getMilestones(): Promise<Milestone[]> {
    return api.getMilestones();
  }

  static async getMilestonesByProject(projectId: string): Promise<Milestone[]> {
    return api.getMilestonesByProject(projectId);
  }

  static async getMilestoneById(id: number): Promise<Milestone> {
    return api.getMilestone(id);
  }

  static async updateMilestone(id: number, data: Partial<Milestone>): Promise<Milestone> {
    return api.updateMilestone(id, data);
  }

  static async deleteMilestone(id: number): Promise<void> {
    return api.deleteMilestone(id);
  }

  // ==================
  // Sponsored Project Operations
  // ==================
  static async createSponsoredProject(data: SponsoredProject): Promise<SponsoredProject> {
    return api.createSponsored(data);
  }

  static async getSponsored(): Promise<SponsoredProject[]> {
    return api.getSponsored();
  }

  static async getSponsoredById(id: number): Promise<SponsoredProject> {
    return api.getSponsoredById(id);
  }

  static async getSponsoredByStatus(status: string): Promise<SponsoredProject[]> {
    return api.getSponsoredByStatus(status);
  }

  static async updateSponsored(id: number, data: Partial<SponsoredProject>): Promise<SponsoredProject> {
    return api.updateSponsored(id, data);
  }

  static async deleteSponsored(id: number): Promise<void> {
    return api.deleteSponsored(id);
  }

  // ==================
  // Arkiv Blockchain Operations
  // ==================
  static async saveToArkiv(projectData: {
    project: Project;
    ai_score: number;
    decision: string;
    contract_address: string;
  }): Promise<{ entity_key: string; status: string }> {
    return api.saveToArkiv(projectData);
  }

  static async getFromArkiv(): Promise<SponsoredProject[]> {
    return api.getFromArkiv();
  }

  static async evaluateProject(projectId: number): Promise<EvaluationResult> {
    return api.evaluateProject(projectId);
  }

  // ==================
  // Escrow Operations
  // ==================
  static async deployEscrow(projectId: number): Promise<{ success: boolean; contract_address: string }> {
    const url = `${arkivAPI.deployEscrow()}?project_id=${projectId}`;
    return apiCall<{ success: boolean; contract_address: string }>("POST", url);
  }

  static async getEscrowInfo(projectId: number): Promise<any> {
    const url = arkivAPI.getEscrowInfo(projectId);
    return apiCall<any>("GET", url);
  }

  // ==================
  // Combined Operations
  // ==================
  static async submitProject(
    projectData: Project,
    milestones: Milestone[],
    aiScore: number,
    decision: string
  ): Promise<{
    project: Project;
    milestones: Milestone[];
    arkivEntity?: { entity_key: string };
  }> {
    try {
      // 1. Create project
      const createdProject = await this.createProject(projectData);

      // 2. Create milestones
      const createdMilestones = await Promise.all(
        milestones.map((m) =>
          this.createMilestone({
            ...m,
            project_id: createdProject.project_id,
          })
        )
      );

      // 3. Save to Arkiv blockchain
      const arkivEntity = await this.saveToArkiv({
        project: createdProject,
        ai_score: aiScore,
        decision,
        contract_address: `0x${Math.random().toString(16).slice(2)}`,
      });

      return {
        project: createdProject,
        milestones: createdMilestones,
        arkivEntity,
      };
    } catch (error) {
      console.error("Error submitting project:", error);
      throw error;
    }
  }
}
