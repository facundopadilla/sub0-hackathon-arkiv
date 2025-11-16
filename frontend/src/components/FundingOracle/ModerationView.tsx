import React, { useEffect, useState } from "react";
import { FileText, Coins, CheckCircle, Link as LinkIcon, Zap, Loader } from "lucide-react";
import { ProjectService, SponsoredProject } from "../../services/projectService";

type ModerationViewProps = {
  onNotification: (message: string, type?: "success" | "error") => void;
  onPendingCountChange: (count: number) => void;
};

export const ModerationView: React.FC<ModerationViewProps> = ({
  onNotification,
  onPendingCountChange,
}) => {
  const [pendingProjects, setPendingProjects] = useState<SponsoredProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SponsoredProject | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
  const [evaluationMessage, setEvaluationMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch all projects from backend for moderation
    const fetchPendingProjects = async () => {
      setLoading(true);
      try {
        // Get ALL projects (submitted, rejected, etc) for moderator review
        const projects = await ProjectService.getSponsored();
        setPendingProjects(projects);
        onPendingCountChange(projects.length);
      } catch (error) {
        console.error("Error al cargar proyectos para moderación", error);
        onNotification("Error al cargar proyectos para moderación", "error");
        setPendingProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingProjects();
  }, [onNotification, onPendingCountChange]);

  useEffect(() => {
    onPendingCountChange(pendingProjects.length);
  }, [pendingProjects, onPendingCountChange]);

  const handleReEvaluateProject = async (projectId: number, projectName: string) => {
    setEvaluatingId(projectId);
    setEvaluationMessage(null);
    try {
      const result = await ProjectService.evaluateProject(projectId);
      
      // ✅ GUARDAR EN LA BD el nuevo score y status
      await ProjectService.updateSponsored(projectId, {
        ai_score: result.ai_score,
        status: result.decision,
      });
      
      // Actualizar el proyecto seleccionado con el nuevo AI score
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({
          ...selectedProject,
          ai_score: result.ai_score,
          status: result.decision,
        });
      }

      // Actualizar en la lista de proyectos
      setPendingProjects(pendingProjects.map(p => 
        p.id === projectId 
          ? { ...p, ai_score: result.ai_score, status: result.decision }
          : p
      ));
      
      const message = `✅ ${projectName} reevaluado: ${(result.ai_score * 100).toFixed(0)}% (${result.decision})`;
      setEvaluationMessage(message);
      onNotification(message, "success");
      // Message persists until user selects another project
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error reevaluando proyecto";
      setEvaluationMessage(`❌ Error: ${errorMsg}`);
      onNotification(`Error: ${errorMsg}`, "error");
      // Error message persists until user selects another project
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleEvaluateProject = async (
    project: SponsoredProject,
    decision: "approve" | "reject"
  ) => {
    setLoading(true);
    try {
      if (decision === "approve") {
        // Update project status to "approved"
        await ProjectService.updateSponsored(project.id || 0, {
          status: "approved",
        });

        onNotification(
          `✅ Proyecto aprobado: ${project.name}`,
          "success"
        );

        // Remove from pending list
        setPendingProjects((prev) =>
          prev.filter((p) => p.id !== project.id)
        );
        setSelectedProject(null);
      } else {
        // Update project status to "rejected"
        await ProjectService.updateSponsored(project.id || 0, {
          status: "rejected",
        });

        onNotification(`❌ Proyecto rechazado: ${project.name}`, "success");

        // Remove from pending list
        setPendingProjects((prev) =>
          prev.filter((p) => p.id !== project.id)
        );
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error al procesar la evaluación", error);
      onNotification("Error al procesar la evaluación", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-white">Moderación de Proyectos</h2>
        <p className="text-gray-400">
          Evalúa y aprueba proyectos propuestos a la comunidad Polkadot
        </p>
      </div>

      {loading && pendingProjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-400">Cargando proyectos pendientes...</p>
        </div>
      ) : pendingProjects.length === 0 ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-2">
            No hay proyectos pendientes de evaluación
          </p>
          <p className="text-sm text-gray-500">
            Los nuevos proyectos aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de pendientes */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Proyectos Pendientes ({pendingProjects.length})
              </h3>
              <div className="space-y-2">
                {pendingProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      setSelectedProject(project);
                      setEvaluationMessage(null); // Limpiar mensaje al cambiar de proyecto
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedProject?.id === project.id
                        ? "bg-purple-500/20 border-2 border-purple-500"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">
                        {project.name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        <Coins className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-yellow-400">
                          ${project.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mb-2">
                      {project.project_id}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{project.created_at?.split('T')[0]}</span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {project.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detalle del proyecto seleccionado */}
          <div className="lg:col-span-2">
            {!selectedProject ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <FileText className="w-16 h-16 mx-auto text-gray-600" />
                  <p className="text-gray-400">
                    Selecciona un proyecto para ver sus detalles
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {selectedProject.name}
                      </h3>
                      <p className="text-sm text-gray-400 font-mono">
                        {selectedProject.project_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white flex items-center space-x-2">
                        <Coins className="w-6 h-6 text-yellow-400" />
                        <span>${selectedProject.budget.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        AI Score: {(selectedProject.ai_score * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <a
                    href={selectedProject.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-sm text-purple-400 hover:text-purple-300"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span>{selectedProject.repo}</span>
                  </a>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-sm font-semibold text-white mb-3">
                    Descripción del Proyecto
                  </h4>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedProject.description || "Sin descripción disponible"}
                  </p>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6">
                    <p className="text-sm text-blue-300">
                      <span className="font-semibold">📋 Información:</span> Este proyecto fue
                      presentado con un puntaje AI de {(selectedProject.ai_score * 100).toFixed(0)}% y está
                      listo para revisión final antes de ser desplegado en{" "}
                      {selectedProject.chain}.
                    </p>
                  </div>

                  {/* Re-evaluate Button */}
                  <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <button
                      onClick={() =>
                        handleReEvaluateProject(
                          selectedProject.id || 0,
                          selectedProject.name
                        )
                      }
                      disabled={evaluatingId === selectedProject.id}
                      className={`w-full px-4 py-2 rounded text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                        evaluatingId === selectedProject.id
                          ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                          : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30 hover:border-purple-500/50"
                      }`}
                    >
                      {evaluatingId === selectedProject.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          <span>Reevaluando con AI...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Reevaluar con AI</span>
                        </>
                      )}
                    </button>
                    {evaluationMessage && (
                      <p className="mt-2 text-xs text-center text-purple-300">
                        {evaluationMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() =>
                        handleEvaluateProject(selectedProject, "reject")
                      }
                      disabled={loading}
                      className="flex-1 py-4 bg-red-600/20 hover:bg-red-600/30 border-2 border-red-500 text-red-300 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "..." : "❌ Rechazar Proyecto"}
                    </button>
                    <button
                      onClick={() =>
                        handleEvaluateProject(selectedProject, "approve")
                      }
                      disabled={loading}
                      className="flex-1 py-4 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Procesando...
                        </span>
                      ) : (
                        "✅ Aprobar Proyecto"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
