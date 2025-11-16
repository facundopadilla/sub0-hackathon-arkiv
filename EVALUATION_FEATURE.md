# ✨ Feature: AI Evaluation Button en Proyectos

## 📋 Descripción

Ahora cada proyecto en la vista **"Proyectos en Arkiv"** tiene un botón **"Evaluar con AI"** que permite:

1. ✅ Evaluar el proyecto con AI en tiempo real
2. ✅ Actualizar automáticamente el AI Score
3. ✅ Cambiar el estado (approve/reject/borderline)
4. ✅ Mostrar feedback visual del resultado

---

## 🎯 Flujo de Evaluación

```
Usuario hace click en "Evaluar con AI"
    ↓
Frontend: POST /api/v1/arkiv/evaluate?project_id=X
    ↓
Backend: Procesa proyecto con AI
    ↓
Backend: Retorna { ai_score, decision, rationale }
    ↓
Frontend: Actualiza la tarjeta del proyecto
    ↓
Usuario ve el nuevo score y estado ✅
```

---

## 📁 Cambios Realizados

### 1. **Config API** - `frontend/src/config/api.ts`

Agregué endpoint de evaluación:

```typescript
// ✨ NEW
export const arkivAPI = {
  sponsor: () => `${API_PREFIX}/sponsor`,
  listFromChain: () => `${API_PREFIX}/arkiv-sponsored`,
  evaluate: (projectId: number) =>
    `${API_PREFIX}/evaluate?project_id=${projectId}`, // ← NEW
};

export const api = {
  // ... otros métodos
  evaluateProject: (projectId: number) =>
    apiCall<any>("POST", arkivAPI.evaluate(projectId)), // ← NEW
};
```

### 2. **Service** - `frontend/src/services/projectService.ts`

Agregué interfaz y método:

```typescript
// ✨ NEW
export interface EvaluationResult {
  ai_score: number;
  decision: string;
  rationale: string;
}

export class ProjectService {
  // ... otros métodos

  static async evaluateProject(projectId: number): Promise<EvaluationResult> {
    // ← NEW
    return api.evaluateProject(projectId);
  }
}
```

### 3. **Componente** - `frontend/src/components/FundingOracle/ProjectsListView.tsx`

Agregué:

**a) Estados para manejo de evaluación:**

```typescript
const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
const [evaluationMessage, setEvaluationMessage] = useState<string | null>(null);
```

**b) Función de evaluación:**

```typescript
const handleEvaluateProject = async (
  projectId: number,
  projectName: string
) => {
  setEvaluatingId(projectId);
  setEvaluationMessage(null);
  try {
    const result = await ProjectService.evaluateProject(projectId);

    // Actualizar el proyecto con el nuevo AI score
    setProjects(
      projects.map((p) =>
        p.id === projectId
          ? { ...p, ai_score: result.ai_score, status: result.decision }
          : p
      )
    );

    setEvaluationMessage(
      `✅ ${projectName} evaluado: ${(result.ai_score * 100).toFixed(0)}% (${
        result.decision
      })`
    );
    setTimeout(() => setEvaluationMessage(null), 5000);
  } catch (err) {
    // manejo de error
  }
};
```

**c) Botón en JSX:**

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
  {evaluationMessage && (
    <p className="mt-2 text-xs text-center text-purple-300">
      {evaluationMessage}
    </p>
  )}
</div>
```

---

## 🎨 Visual

### Botón Normal (Inactivo)

- Fondo: Purple semi-transparente
- Texto: "⚡ Evaluar con AI"
- Hover: Se intensifica el color
- Border: Purple suave

### Botón Evaluando (Cargando)

- Fondo: Gris
- Texto: "⏳ Evaluando..."
- Spinner animado
- Disabled: No se puede hacer click

### Mensaje de Resultado

- Aparece debajo del botón
- Desaparece en 5 segundos automáticamente
- Formato: ✅/❌ Nombre: Score (decision)

---

## 🚀 Cómo Usar

1. **Abre el Frontend**: http://localhost:5173
2. **Ve a**: Sección "Proyectos en Arkiv"
3. **Cada tarjeta** de proyecto ahora tiene un botón "⚡ Evaluar con AI"
4. **Click en el botón** → Evaluación en tiempo real
5. **El score se actualiza** automáticamente en la tarjeta
6. **El estado cambia** a approve/reject/borderline

---

## ✅ Features

| Feature                              | Status  |
| ------------------------------------ | ------- |
| Botón de evaluación en cada proyecto | ✅ Done |
| Llamada a endpoint AI                | ✅ Done |
| Actualizar AI Score automáticamente  | ✅ Done |
| Actualizar estado (decision)         | ✅ Done |
| Loading indicator (spinner)          | ✅ Done |
| Mensaje de éxito/error               | ✅ Done |
| Disabled durante evaluación          | ✅ Done |
| Auto-close del mensaje               | ✅ Done |
| Hover effects                        | ✅ Done |

---

## 🔗 Endpoints Usados

| Método | URL                                   | Propósito               |
| ------ | ------------------------------------- | ----------------------- |
| POST   | `/api/v1/arkiv/evaluate?project_id=X` | Evaluar proyecto con AI |

---

## 📝 Notas Técnicas

- **El score se actualiza en la UI** pero no se persiste en Arkiv blockchain
- **Si necesitas persistencia**, el backend debe guardar a `sponsoredproject` tabla
- **El rationale de AI no se muestra** en la UI (está disponible en el resultado)
- **Puedes agregar** un modal para mostrar el rationale completo

---

## 🎯 Próximos Pasos (Opcional)

1. Mostrar el rationale en un modal
2. Guardar evaluaciones en historial
3. Permitir re-evaluaciones múltiples
4. Mostrar métricas detalladas de AI score
5. Comparar scores anteriores vs nuevos

---

## 🧪 Testing

Para probar la feature:

1. **Backend debe estar ejecutándose**: http://localhost:8000
2. **Frontend debe estar ejecutándose**: http://localhost:5173
3. **Debe haber proyectos en la BD** (que aparezcan en "Proyectos en Arkiv")
4. **Click en "Evaluar con AI"**
5. **Espera 2-3 segundos** mientras procesa
6. **Verifica** que el score cambie

---

## 🐛 Troubleshooting

**Error: "No se pudo evaluar el proyecto"**

- Verifica que el backend esté corriendo
- Revisa que el project_id exista en BD
- Chequea los logs del backend

**El score no cambia**

- Verifica que la respuesta del backend sea correcta
- Revisa la consola del navegador (F12)

**Botón no aparece**

- Limpiar caché del navegador (Ctrl+Shift+Del)
- Recargar página (F5)
