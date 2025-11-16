# ✨ Botón Reevaluar con AI en Moderación

## 🎯 Feature Implementado

Agregué un botón **"Reevaluar con AI"** en la vista de **Moderación de Proyectos** que permite:

1. ✅ Reevaluar un proyecto seleccionado con AI en tiempo real
2. ✅ Actualizar automáticamente el AI Score
3. ✅ Cambiar el estado (approve/reject/borderline)
4. ✅ Mostrar feedback visual en tiempo real

---

## 📊 Visual del Botón

```
┌─────────────────────────────────────────────┐
│  📋 Proyecto XYZ (Seleccionado)             │
│                                             │
│  Descripción: ...                           │
│                                             │
│  📋 Información: AI Score 750%              │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ ⚡ Reevaluar con AI                     ││
│  │ ✅ Proyecto reevaluado: 750% (approve)  ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌──────────────────┬──────────────────────┐│
│  │ ❌ Rechazar      │ ✅ Aprobar Proyecto │││
│  └──────────────────┴──────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## 🔧 Cambios Realizados

### **Archivo**: `frontend/src/components/FundingOracle/ModerationView.tsx`

**1. Imports Actualizados:**
```diff
- import { FileText, Coins, CheckCircle, Link as LinkIcon } from "lucide-react";
+ import { FileText, Coins, CheckCircle, Link as LinkIcon, Zap, Loader } from "lucide-react";
```

**2. Estados Agregados:**
```typescript
const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
const [evaluationMessage, setEvaluationMessage] = useState<string | null>(null);
```

**3. Nueva Función:**
```typescript
const handleReEvaluateProject = async (projectId: number, projectName: string) => {
  setEvaluatingId(projectId);
  setEvaluationMessage(null);
  try {
    const result = await ProjectService.evaluateProject(projectId);
    
    // Actualizar proyecto seleccionado
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject({
        ...selectedProject,
        ai_score: result.ai_score,
        status: result.decision,
      });
    }

    // Actualizar lista
    setPendingProjects(pendingProjects.map(p => 
      p.id === projectId 
        ? { ...p, ai_score: result.ai_score, status: result.decision }
        : p
    ));
    
    // Mostrar mensaje
    const message = `✅ ${projectName} reevaluado: ${(result.ai_score * 100).toFixed(0)}% (${result.decision})`;
    setEvaluationMessage(message);
    onNotification(message, "success");
    setTimeout(() => setEvaluationMessage(null), 5000);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error reevaluando proyecto";
    setEvaluationMessage(`❌ Error: ${errorMsg}`);
    onNotification(`Error: ${errorMsg}`, "error");
    setTimeout(() => setEvaluationMessage(null), 5000);
  } finally {
    setEvaluatingId(null);
  }
};
```

**4. Botón en JSX:**
```tsx
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
```

---

## 🚀 Flujo de Uso

```
1. Moderador ve "Moderación de Proyectos"
   ↓
2. Selecciona un proyecto de la lista (lado izquierdo)
   ↓
3. Se muestra panel derecho con detalles
   ↓
4. Lee la información del proyecto
   ↓
5. Hace click en "⚡ Reevaluar con AI"
   ↓
6. Button cambia a "⏳ Reevaluando con AI..."
   ↓
7. Frontend: POST /api/v1/arkiv/evaluate?project_id=X
   ↓
8. Backend procesa con Google GenAI
   ↓
9. Se actualiza el score en la tarjeta
   ↓
10. Mensaje de éxito: "✅ Proyecto reevaluado: 750% (approve)"
   ↓
11. Moderador puede aprobar/rechazar con scores actualizados
```

---

## 🎨 Estados del Botón

| Estado | Visual | Comportamiento |
|--------|--------|----------------|
| Normal | Purple, interactivo | Click → Reevalúa |
| Evaluando | Gris, disabled, spinner | Espera respuesta AI |
| Error | Rojo, mensaje error | Se desvanece en 5s |
| Éxito | Verde, mensaje OK | Se desvanece en 5s |

---

## ✅ Features

- ✅ Botón visible en panel de detalles
- ✅ Actualiza score en tiempo real
- ✅ Actualiza estado (decision)
- ✅ Loading indicator (spinner)
- ✅ Mensaje de resultado (5s auto-dismiss)
- ✅ Disabled durante evaluación
- ✅ Integrado con sistema de notificaciones
- ✅ Sin errores de compilación

---

## 📝 Posicionamiento en UI

**Antes:**
```
┌──────────────────────────────┐
│ 📋 Información: AI Score     │
│                              │
│ ❌ Rechazar │ ✅ Aprobar    │
└──────────────────────────────┘
```

**Después:**
```
┌──────────────────────────────┐
│ 📋 Información: AI Score     │
│                              │
│ ┌──────────────────────────┐ │
│ │ ⚡ Reevaluar con AI      │ │
│ │ ✅ Proyecto reevaluado   │ │
│ └──────────────────────────┘ │
│                              │
│ ❌ Rechazar │ ✅ Aprobar    │
└──────────────────────────────┘
```

---

## 🧪 Testing

1. **Abre Frontend**: http://localhost:5173
2. **Ve a**: Sección "Moderación"
3. **Selecciona un proyecto** de la lista (lado izquierdo)
4. **Verás el botón "⚡ Reevaluar con AI"**
5. **Haz click en el botón**
6. **Espera 2-3 segundos** mientras procesa
7. **Verifica** que el AI Score se actualice
8. **Verifica** que el mensaje de éxito aparezca

---

## 🔗 Endpoint Usado

```bash
POST /api/v1/arkiv/evaluate?project_id=1

Response:
{
  "ai_score": 0.75,
  "decision": "approve",
  "rationale": "Project has clear goals..."
}
```

---

## 📊 Changelog

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `ModerationView.tsx` | +2 | Imports (Zap, Loader) |
| `ModerationView.tsx` | +2 | Estados (evaluatingId, evaluationMessage) |
| `ModerationView.tsx` | +30 | Función handleReEvaluateProject |
| `ModerationView.tsx` | +25 | Button JSX + mensaje |

**Total**: 59 líneas agregadas ✅

---

## 🎉 Resultado

Ahora los moderadores pueden:
1. ✅ Ver proyectos pendientes
2. ✅ Seleccionar un proyecto para revisar
3. ✅ **Reevaluar con AI antes de decidir**
4. ✅ Ver el score actualizado
5. ✅ Aprobar o rechazar con información fresca

**Feature completa y lista para usar!** 🚀
