import React, { useState } from "react";
import { Database } from "lucide-react";
import { ProjectService } from "../../services/projectService";

type SubmitProjectFormProps = {
  onNotification: (message: string, type?: "success" | "error") => void;
};

type MilestoneForm = {
  name: string;
  description: string;
  amount: string;
};

type FormDataState = {
  project_id: string;
  name: string;
  repo: string;
  description: string;
  budget: string;
  duration_months: string;
  milestones: MilestoneForm[];
};

export const SubmitProjectForm: React.FC<SubmitProjectFormProps> = ({
  onNotification,
}) => {
  const [formData, setFormData] = useState<FormDataState>({
    project_id: "",
    name: "",
    repo: "",
    description: "",
    budget: "",
    duration_months: "",
    milestones: [{ name: "", description: "", amount: "" }],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof MilestoneForm,
    value: string
  ) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index][field] = value;
    setFormData((prev) => ({ ...prev, milestones: newMilestones }));
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { name: "", description: "", amount: "" }],
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const handleSubmitProject = async () => {
    if (
      !formData.project_id ||
      !formData.name ||
      !formData.repo ||
      !formData.budget ||
      !formData.duration_months
    ) {
      onNotification(
        "⚠️ Por favor completa todos los campos requeridos",
        "error"
      );
      return;
    }

    if (formData.milestones.some((m) => !m.name || !m.amount)) {
      onNotification(
        "⚠️ Completa todos los milestones (nombre y monto)",
        "error"
      );
      return;
    }

    setSubmitting(true);
    try {
      // Prepare project data
      const projectData = {
        project_id: formData.project_id,
        name: formData.name,
        repo: formData.repo,
        description: formData.description,
        budget: parseFloat(formData.budget),
      };

      // Prepare milestones data
      const milestonesData = formData.milestones.map((m) => ({
        project_id: formData.project_id,
        name: m.name,
        description: m.description,
        amount: parseFloat(m.amount),
      }));

      // Submit project with all data to backend
      const result = await ProjectService.submitProject(
        projectData,
        milestonesData,
        7.5, // Default AI score
        "submitted" // Default decision
      );

      onNotification(
        `✅ Proyecto enviado exitosamente a Polkadot y Arkiv. Entity Key: ${result.arkivEntity?.entity_key?.slice(0, 16)}...`,
        "success"
      );

      // Reset form
      setFormData({
        project_id: "",
        name: "",
        repo: "",
        description: "",
        budget: "",
        duration_months: "",
        milestones: [{ name: "", description: "", amount: "" }],
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      onNotification(`❌ Error al enviar el proyecto: ${errorMessage}`, "error");
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-white">Propón tu Proyecto</h2>
        <p className="text-gray-400">
          Sistema descentralizado: DAO → Polkadot → IA → Arkiv
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna formulario + info Arkiv */}
        <div className="space-y-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project ID *
                </label>
                <input
                  type="text"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="ej: polkadot-dex-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Mi proyecto en Polkadot"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Repositorio *
              </label>
              <input
                type="text"
                name="repo"
                value={formData.repo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://github.com/tu-usuario/proyecto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe tu proyecto y cómo contribuirá al ecosistema Polkadot..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Presupuesto Total (USD) *
                </label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duración (meses) *
                </label>
                <input
                  type="number"
                  name="duration_months"
                  value={formData.duration_months}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="6"
                />
              </div>
            </div>

            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Database className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-purple-300">
                  <div className="font-semibold mb-1">
                    Información sobre Arkiv
                  </div>
                  <div className="space-y-1 text-purple-300/80">
                    <div>
                      • Tus datos se almacenarán en el{" "}
                      <span className="font-semibold">estado de bloque</span> de
                      Arkiv
                    </div>
                    <div>
                      • La duración determina el tiempo de almacenamiento
                      (extensible/reducible)
                    </div>
                    <div>
                      • El costo se calcula según el tiempo de almacenamiento
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Milestones del Proyecto
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Define las etapas y montos de cada milestone
                </p>
              </div>
              <button
                onClick={addMilestone}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                + Agregar
              </button>
            </div>

            <div className="space-y-4">
              {formData.milestones.map((milestone, index) => (
                <div
                  key={index}
                  className="p-4 bg-white/5 rounded-lg space-y-3 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-400">
                      Milestone {index + 1}
                    </span>
                    {formData.milestones.length > 1 && (
                      <button
                        onClick={() => removeMilestone(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) =>
                      handleMilestoneChange(index, "name", e.target.value)
                    }
                    placeholder="Nombre del milestone *"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={milestone.description}
                    onChange={(e) =>
                      handleMilestoneChange(index, "description", e.target.value)
                    }
                    placeholder="Descripción (opcional)"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="number"
                    value={milestone.amount}
                    onChange={(e) =>
                      handleMilestoneChange(index, "amount", e.target.value)
                    }
                    placeholder="Monto en USD *"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Info flujo post-envío */}
          <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">
              📋 ¿Qué sucede después?
            </h4>
            <ol className="text-xs text-blue-300/80 space-y-2 ml-4 list-decimal">
              <li>
                Tu proyecto será enviado a la base de datos y a la{" "}
                <span className="font-semibold">comunidad Polkadot</span>
              </li>
              <li>
                La comunidad evaluará tu propuesta (manualmente o con asistencia
                de IA)
              </li>
              <li>
                Si es aprobado por votación, se generará un{" "}
                <span className="font-semibold">smart contract</span> en
                Polkadot
              </li>
              <li>Un agente IA realizará una re-evaluación final</li>
              <li>
                Todo se almacenará en <span className="font-semibold">Arkiv</span>{" "}
                para seguimiento del progreso
              </li>
            </ol>
          </div>

          <button
            onClick={handleSubmitProject}
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Enviando proyecto...
              </span>
            ) : (
              "🚀 Enviar Proyecto a Polkadot"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
