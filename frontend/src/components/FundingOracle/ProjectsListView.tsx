import React, { useEffect, useState } from "react";
import {
  Database,
  FileText,
  Coins,
  Clock,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Zap,
  Loader,
  Rocket,
} from "lucide-react";
import { ProjectService, SponsoredProject } from "../../services/projectService";

type ProjectStatus = "approve" | "reject" | "borderline" | "submitted" | "approved" | "rejected" | string;

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case "approve":
      return "text-green-400";
    case "reject":
      return "text-red-400";
    case "borderline":
      return "text-yellow-400";
    default:
      return "text-gray-400";
  }
};

const getStatusIcon = (status: ProjectStatus) => {
  switch (status) {
    case "approve":
      return <CheckCircle className="w-5 h-5" />;
    case "reject":
      return <XCircle className="w-5 h-5" />;
    case "borderline":
      return <Clock className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export const ProjectsListView: React.FC = () => {
  const [projects, setProjects] = useState<SponsoredProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
  const [evaluationMessages, setEvaluationMessages] = useState<Record<number, string>>({});
  const [launchingId, setLaunchingId] = useState<number | null>(null);
  const [launchMessages, setLaunchMessages] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch only approved projects from database (saved in Arkiv)
        const data = await ProjectService.getSponsoredByStatus("approved");
        
        // Asegurar que data es un array
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error("Respuesta no es un array:", data);
          setProjects([]);
          setError("Formato de respuesta inválido");
        }
      } catch (err) {
        console.error("Error al cargar proyectos desde Arkiv", err);
        setError("No se pudieron cargar los proyectos. Por favor, intenta nuevamente.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleEvaluateProject = async (projectId: number, projectName: string) => {
    setEvaluatingId(projectId);
    setEvaluationMessages(prev => ({ ...prev, [projectId]: "" }));
    try {
      const result = await ProjectService.evaluateProject(projectId);
      
      // Actualizar en la BD el nuevo score y status
      await ProjectService.updateSponsored(projectId, {
        ai_score: result.ai_score,
        status: result.decision,
      });
      
      // Actualizar el proyecto en la UI
      if (Array.isArray(projects)) {
        setProjects(projects.map(p => 
          p.id === projectId 
            ? { ...p, ai_score: result.ai_score, status: result.decision }
            : p
        ));
      }
      
      const message = `✅ ${projectName} evaluado: ${(result.ai_score * 100).toFixed(0)}% (${result.decision})`;
      setEvaluationMessages(prev => ({ ...prev, [projectId]: message }));
      setTimeout(() => setEvaluationMessages(prev => ({ ...prev, [projectId]: "" })), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error evaluando proyecto";
      const message = `❌ Error: ${errorMsg}`;
      setEvaluationMessages(prev => ({ ...prev, [projectId]: message }));
      setTimeout(() => setEvaluationMessages(prev => ({ ...prev, [projectId]: "" })), 5000);
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleLaunchProject = async (projectId: number, projectName: string) => {
    setLaunchingId(projectId);
    setLaunchMessages(prev => ({ ...prev, [projectId]: "Desplegando escrow..." }));
    try {
      const result = await ProjectService.deployEscrow(projectId);
      
      if (result.success) {
        // Actualizar el proyecto con la dirección del contrato
        await ProjectService.updateSponsored(projectId, {
          contract_address: result.contract_address,
        });
        
        // Actualizar en la UI
        setProjects(projects.map(p => 
          p.id === projectId 
            ? { ...p, contract_address: result.contract_address }
            : p
        ));
        
        const message = `🚀 ${projectName} lanzado exitosamente`;
        setLaunchMessages(prev => ({ ...prev, [projectId]: message }));
        setTimeout(() => setLaunchMessages(prev => ({ ...prev, [projectId]: "" })), 5000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desplegando escrow";
      const message = `❌ Error: ${errorMsg}`;
      setLaunchMessages(prev => ({ ...prev, [projectId]: message }));
      setTimeout(() => setLaunchMessages(prev => ({ ...prev, [projectId]: "" })), 5000);
    } finally {
      setLaunchingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-white">Proyectos en Arkiv</h2>
        <p className="text-gray-400">
          Proyectos aprobados por Polkadot con seguimiento descentralizado
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-400">Cargando desde Arkiv...</p>
        </div>
      ) : error ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <XCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <p className="text-red-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500">
            Verifica que el servidor backend esté en ejecución
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <Database className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-2">
            No hay proyectos almacenados en Arkiv todavía
          </p>
          <p className="text-sm text-gray-500">
            Los proyectos aprobados aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div
              key={project._entity_key || project.id || `project-${index}`}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2 flex-1">
                  <div
                    className={`p-2 rounded-lg ${getStatusColor(
                      project.status
                    )} bg-current bg-opacity-10`}
                  >
                    {getStatusIcon(project.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {project.project_id}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-10">
                {project.description || "Sin descripción"}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">AI Score</span>
                  <span className="font-semibold text-purple-400">
                    {(project.ai_score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Presupuesto</span>
                  <div className="flex items-center space-x-1">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="font-semibold text-white">
                      ${project.budget.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Duración</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="font-semibold text-white">
                      N/A
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Chain</span>
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                    {project.chain}
                  </span>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <a
                    href={project.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center space-x-1 group-hover:underline"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Ver repositorio</span>
                  </a>

                  <div className="flex items-start space-x-1">
                    <LinkIcon className="w-3 h-3 text-gray-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-500 font-mono break-all">
                      {project.contract_address}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                    <Database className="w-3 h-3" />
                    <span>Arkiv Entity (estado de bloque):</span>
                  </div>
                  <span className="text-xs font-mono text-gray-400 break-all block">
                    {project._entity_key?.substring(0, 24)}...
                  </span>
                </div>

                {/* Evaluation Button Section */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <button
                    onClick={() => handleEvaluateProject(project.id || 0, project.name)}
                    disabled={evaluatingId === project.id}
                    className={`w-full px-3 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      evaluatingId === project.id
                        ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                        : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50"
                    }`}
                  >
                    {evaluatingId === project.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Evaluando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Evaluar con AI</span>
                      </>
                    )}
                  </button>
                  {evaluationMessages[project.id || 0] && (
                    <p className="mt-2 text-xs text-center text-purple-300">
                      {evaluationMessages[project.id || 0]}
                    </p>
                  )}

                  {/* Launch Project Button */}
                  <button
                    onClick={() => handleLaunchProject(project.id || 0, project.name)}
                    disabled={launchingId === project.id}
                    className={`w-full px-3 py-2 rounded text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                      launchingId === project.id
                        ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                        : "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 hover:border-blue-500/50"
                    }`}
                  >
                    {launchingId === project.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Lanzando...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>🚀 Lanzar Proyecto</span>
                      </>
                    )}
                  </button>
                  {launchMessages[project.id || 0] && (
                    <p className="mt-2 text-xs text-center text-blue-300">
                      {launchMessages[project.id || 0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
