# 🎯 Evaluación AI en Tiempo Real - Setup Completo

## ✅ Feature Implementado

Cada proyecto en **"Proyectos en Arkiv"** ahora tiene un botón para evaluarlo con AI en tiempo real.

---

## 📊 Visual del Botón

```
┌─────────────────────────────────────────┐
│  📋 Proyecto XYZ                        │
│                                         │
│  AI Score: 750% ⚡                      │
│  Presupuesto: $10,000                   │
│  Chain: asset_hub                       │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ⚡ Evaluar con AI                   ││
│  └─────────────────────────────────────┘│
│                                         │
│  ✅ Proyecto evaluado: 750% (approve)  │
│                                         │
└─────────────────────────────────────────┘

Estados del Botón:
┌──────────────────┬──────────────────┐
│    Normal        │    Evaluando     │
├──────────────────┼──────────────────┤
│ ⚡ Evaluar con AI │ ⏳ Evaluando... │
│ Purple/Hover     │ Gris/Disabled    │
└──────────────────┴──────────────────┘
```

---

## 🔧 Archivos Modificados

### 1️⃣ Config API (`frontend/src/config/api.ts`)
```diff
  export const arkivAPI = {
    sponsor: () => `${API_PREFIX}/sponsor`,
    listFromChain: () => `${API_PREFIX}/arkiv-sponsored`,
+   evaluate: (projectId: number) => `${API_PREFIX}/evaluate?project_id=${projectId}`,
  };

  export const api = {
    // ...
    saveToArkiv: (data: any) => apiCall<any>("POST", arkivAPI.sponsor(), data),
    getFromArkiv: () => apiCall<any>("GET", arkivAPI.listFromChain()),
+   evaluateProject: (projectId: number) => apiCall<any>("POST", arkivAPI.evaluate(projectId)),
  };
```

### 2️⃣ Service (`frontend/src/services/projectService.ts`)
```diff
+ export interface EvaluationResult {
+   ai_score: number;
+   decision: string;
+   rationale: string;
+ }

  export class ProjectService {
    // ... métodos existentes
    
+   static async evaluateProject(projectId: number): Promise<EvaluationResult> {
+     return api.evaluateProject(projectId);
+   }
  }
```

### 3️⃣ Componente (`frontend/src/components/FundingOracle/ProjectsListView.tsx`)

**Imports:**
```diff
  import {
    Database,
    FileText,
    Coins,
    Clock,
    Link as LinkIcon,
    CheckCircle,
    XCircle,
+   Zap,
+   Loader,
  } from "lucide-react";
```

**Estados:**
```diff
- const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
- const [evaluationMessage, setEvaluationMessage] = useState<string | null>(null);

+ const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
+ const [evaluationMessages, setEvaluationMessages] = useState<Record<number, string>>({});
```

**Función:**
```typescript
const handleEvaluateProject = async (projectId: number, projectName: string) => {
  setEvaluatingId(projectId);
  try {
    const result = await ProjectService.evaluateProject(projectId);
    
    // Actualizar UI con nuevo score
    setProjects(projects.map(p => 
      p.id === projectId 
        ? { ...p, ai_score: result.ai_score, status: result.decision }
        : p
    ));
    
    // Mostrar mensaje 5 segundos
    const message = `✅ ${projectName}: ${(result.ai_score * 100).toFixed(0)}% (${result.decision})`;
    setEvaluationMessages(prev => ({ ...prev, [projectId]: message }));
    setTimeout(() => setEvaluationMessages(prev => ({ ...prev, [projectId]: "" })), 5000);
  } catch (err) {
    // Error handling...
  }
};
```

**Button JSX:**
```tsx
<div className="pt-3 border-t border-white/10">
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
</div>
```

---

## 🚀 Flujo de Ejecución

```
1. Usuario abre "Proyectos en Arkiv"
   ↓
2. Se cargan proyectos desde Arkiv blockchain
   ↓
3. Cada proyecto muestra tarjeta con botón "⚡ Evaluar con AI"
   ↓
4. Usuario hace click
   ↓
5. Button se desactiva: "⏳ Evaluando..."
   ↓
6. Frontend: POST /api/v1/arkiv/evaluate?project_id=X
   ↓
7. Backend: Procesa con Google GenAI
   ↓
8. Backend responde: { ai_score: 0.75, decision: "approve", rationale: "..." }
   ↓
9. Frontend: Actualiza estado del proyecto
   ↓
10. UI muestra: Score actualizado + Message de éxito
   ↓
11. Mensaje desaparece en 5 segundos automáticamente
```

---

## ✨ Comportamiento

### Antes del Click
- Botón: Púrpura, interactivo
- Texto: "⚡ Evaluar con AI"
- Hover: Se intensifica color

### Durante Evaluación
- Botón: Gris, desactivado
- Texto: "⏳ Evaluando..."
- Spinner: Rotando
- Disabled: No se puede hacer click

### Después de Evaluación
- **Si éxito**: ✅ "Proyecto: 750% (approve)" - Se desvanece en 5s
- **Si error**: ❌ "Error: [mensaje]" - Se desvanece en 5s
- Score en tarjeta: Se actualiza en tiempo real
- Botón: Vuelve a estado normal

---

## 📋 Checklist

- ✅ API endpoint agregado al config
- ✅ Método agregado al servicio
- ✅ Estados React configurados
- ✅ Función de evaluación implementada
- ✅ Button UI con estados visuales
- ✅ Loading spinner animado
- ✅ Mensaje de resultado
- ✅ Auto-dismiss del mensaje (5s)
- ✅ Actualización de UI en tiempo real
- ✅ Manejo de errores
- ✅ Sin errores de compilación

---

## 🧪 Testing

### Para probar:

1. **Abre Frontend**: http://localhost:5173
2. **Ve a**: Sección "Proyectos en Arkiv"
3. **Busca un proyecto** (puede ser que falte si DB está vacía)
   - Si no hay proyectos: Envía uno primero desde "Enviar Proyecto"
4. **Haz click** en "⚡ Evaluar con AI"
5. **Verifica**:
   - Botón cambia a "⏳ Evaluando..."
   - Spinner animado
   - Backend procesa (2-3 segundos)
   - Score se actualiza en la tarjeta
   - Mensaje de éxito aparece y desaparece

### Posibles Issues:

| Problema | Solución |
|----------|----------|
| Botón no aparece | Limpiar caché (Ctrl+Shift+Del) |
| Error "No se pudo evaluar" | Backend debe estar corriendo |
| Score no cambia | Revisar consola F12 |
| Message no desaparece | Esperar 5 segundos |

---

## 🔗 Endpoints Usados

```bash
POST /api/v1/arkiv/evaluate?project_id=1

Response:
{
  "ai_score": 0.75,
  "decision": "approve",
  "rationale": "Project has clear goals and realistic budget..."
}
```

---

## 💾 Cambios en Resumen

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `config/api.ts` | +2 | Endpoint evaluate |
| `services/projectService.ts` | +5 | Interface + método |
| `components/.../ProjectsListView.tsx` | +50 | Button + lógica |

**Total**: 3 archivos modificados, 57 líneas agregadas ✅

---

## 🎉 Resultado Final

Ahora los usuarios pueden:
1. ✅ Ver proyectos desde blockchain
2. ✅ Evaluarlos con AI con un click
3. ✅ Ver el score actualizado en tiempo real
4. ✅ Saber el estado (approve/reject/borderline)
5. ✅ Recibir feedback visual clara

**Feature completa y lista para usar!** 🚀
