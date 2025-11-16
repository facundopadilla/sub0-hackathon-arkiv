import React, { useState } from "react";
import { Rocket, GitBranch } from "lucide-react";
import { FlowDiagram } from "./FlowDiagram";
import { Notification } from "./Notification";
import { SubmitProjectForm } from "./SubmitProjectForm";
import { ModerationView } from "./ModerationView";
import { ProjectsListView } from "./ProjectsListView";

type View = "submit" | "moderate" | "projects";

type NotificationState = {
  message: string;
  type: "success" | "error";
};

const FundingOracle: React.FC = () => {
  const [view, setView] = useState<View>("submit");
  const [showFlowDiagram, setShowFlowDiagram] = useState(false);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const [pendingCount, setPendingCount] = useState(0);

  const showNotification = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

      {/* puntitos tipo Polkadot */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-pink-500 rounded-full" />
        <div className="absolute top-40 right-32 w-2 h-2 bg-purple-500 rounded-full" />
        <div className="absolute bottom-32 left-40 w-2 h-2 bg-blue-500 rounded-full" />
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-green-500 rounded-full" />
      </div>

      {/* Notificación flotante */}
      <Notification notification={notification} />

      <div className="relative z-10">
        {/* NAVBAR */}
        <nav className="border-b border-white/10 backdrop-blur-xl bg-black/20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* logo + título */}
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Sub0 Funding Oracle
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      Polkadot
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                      Arkiv
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
                      AI Powered
                    </span>
                  </div>
                </div>
              </div>

              {/* botones de vista */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowFlowDiagram((prev) => !prev)}
                  className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-sm"
                >
                  <GitBranch className="w-4 h-4 inline mr-2" />
                  Flujo
                </button>

                <button
                  onClick={() => setView("submit")}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    view === "submit"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Enviar Proyecto
                </button>

                <button
                  onClick={() => setView("moderate")}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    view === "moderate"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Moderar ({pendingCount})
                </button>

                <button
                  onClick={() => setView("projects")}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    view === "projects"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Proyectos en Arkiv
                </button>
              </div>
            </div>

            {showFlowDiagram && <FlowDiagram />}
          </div>
        </nav>

        {/* CONTENIDO */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {view === "submit" && (
            <SubmitProjectForm onNotification={showNotification} />
          )}

          {view === "moderate" && (
            <ModerationView
              onNotification={showNotification}
              onPendingCountChange={setPendingCount}
            />
          )}

          {view === "projects" && <ProjectsListView />}
        </div>

        {/* FOOTER */}
        <footer className="relative z-10 border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-gray-400 text-sm">
                  Powered by{" "}
                  <span className="text-purple-400 font-semibold">
                    Polkadot
                  </span>
                  ,
                  <span className="text-blue-400 font-semibold"> Arkiv</span> y
                  <span className="text-green-400 font-semibold"> IA</span>
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  Sistema descentralizado de financiamiento con smart contracts
                  y almacenamiento en estado de bloque
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Sistema operativo</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FundingOracle;
