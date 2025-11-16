import React from "react";
import { FileText, Layers, Shield, TrendingUp, Database } from "lucide-react";

export const FlowDiagram: React.FC = () => {
  return (
    <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10">
      <h3 className="text-sm font-semibold text-white mb-4">Flujo del Sistema</h3>
      <div className="flex items-center justify-between text-xs">
        {/* 1 Proyecto */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-gray-400">1. Proyecto</span>
          <span className="text-gray-500 text-center">Envío + DB</span>
        </div>

        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-purple-500/50 mx-2" />

        {/* 2 Polkadot */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Layers className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-gray-400">2. Polkadot</span>
          <span className="text-gray-500 text-center">Evaluación + Votación</span>
        </div>

        <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-pink-500/50 mx-2" />

        {/* 3 Smart Contract */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-pink-400" />
          </div>
          <span className="text-gray-400">3. Smart Contract</span>
          <span className="text-gray-500">Polkadot</span>
        </div>

        <div className="flex-1 h-px bg-gradient-to-r from-pink-500/50 to-green-500/50 mx-2" />

        {/* 4 IA */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-gray-400">4. Agente IA</span>
          <span className="text-gray-500 text-center">Re-evaluación</span>
        </div>

        <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-blue-400/50 mx-2" />

        {/* 5 Arkiv */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
            <Database className="w-6 h-6 text-blue-300" />
          </div>
          <span className="text-gray-400">5. Arkiv</span>
          <span className="text-gray-500">Seguimiento</span>
        </div>
      </div>
    </div>
  );
};
