# 🚀 Botón "Lanzar Proyecto" - Guía de Implementación

## Overview

Agregar un botón "🚀 Lanzar Proyecto" en la pestaña **Arkiv Projects** que:

1. Crea un smart contract escrow con los fondos del proyecto
2. Instancia el contrato en Polkadot (Rococo testnet)
3. Genera hitos automáticos (4 partes iguales)
4. Guarda el contract_address en la BD

---

## 📋 Flujo Completo

```
Usuario ve proyecto en Arkiv Projects
    │
    ├─ Click "🚀 Lanzar Proyecto"
    │
    ├─ Dialog: Confirmar fondos y hitos
    │  ├─ Presupuesto: $10,000
    │  ├─ Hitos: 4 x $2,500
    │  └─ Click "Confirmar y Lanzar"
    │
    ▼
Frontend POST /deploy-escrow
    │
    ├─ project_id: 123
    ├─ total_budget: 10000
    └─ milestones: [...]
    │
    ▼
Backend
    │
    ├─ 1. Validar que proyecto existe y está aprobado
    ├─ 2. Conectar a Polkadot RPC (Rococo)
    ├─ 3. Llamar contrato: create_escrow()
    │     ├─ Envia fondos ($10,000 DOT)
    │     └─ Crea 4 hitos
    ├─ 4. Recibir event: EscrowCreated
    ├─ 5. Extraer contract_address
    ├─ 6. Guardar en BD
    └─ 7. Actualizar Arkiv
    │
    ▼
Frontend
    │
    ├─ Recibe contract_address
    ├─ Muestra: "✅ Contrato creado"
    ├─ Mostrar hitos del escrow
    ├─ Mostrar fondos de cada hito
    └─ Botón para registrar progreso
```

---

## 🎨 Frontend Implementation

### Paso 1: Actualizar ProjectsListView.tsx

Agregar estado para mostrar dialog:

```typescript
const [launchingProject, setLaunchingProject] = useState<number | null>(null);
const [showLaunchDialog, setShowLaunchDialog] = useState(false);
const [launchMessage, setLaunchMessage] = useState<string | null>(null);
```

### Paso 2: Agregar Función handleLaunchProject

```typescript
const handleLaunchProject = async (projectId: number, projectName: string) => {
  setLaunchingProject(projectId);
  setLaunchMessage(null);

  try {
    // 1. Confirmar que desea lanzar
    const confirmed = window.confirm(
      `¿Lanzar proyecto "${projectName}"?\n\nEsto creará un smart contract con los fondos del proyecto.`
    );

    if (!confirmed) {
      setLaunchingProject(null);
      return;
    }

    // 2. Obtener datos del proyecto
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      throw new Error("Proyecto no encontrado");
    }

    // 3. Calcular hitos (4 partes iguales)
    const defaultMilestones = [
      { percentage: 25, description: "Fase 1: Prototipo" },
      { percentage: 25, description: "Fase 2: Beta Testing" },
      { percentage: 25, description: "Fase 3: Producción" },
      { percentage: 25, description: "Fase 4: Soporte y Mantenimiento" },
    ];

    // 4. Llamar backend para deployar escrow
    setLaunchMessage("⏳ Deployando smart contract...");

    const escrowResult = await ProjectService.deployEscrow(
      projectId,
      project.budget || 0,
      defaultMilestones
    );

    // 5. Actualizar proyecto con contract_address
    await ProjectService.updateSponsored(projectId, {
      contract_address: escrowResult.contract_address,
    });

    // 6. Actualizar UI
    setLaunchMessage(
      `✅ ¡Proyecto lanzado exitosamente!\n\n` +
        `Contract: ${escrowResult.contract_address}\n` +
        `Chain: ${escrowResult.chain}`
    );

    // 7. Refrescar proyectos
    await fetchProjects();

    onNotification(`✅ Proyecto "${projectName}" lanzado con éxito`, "success");
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    setLaunchMessage(`❌ Error: ${errorMsg}`);
    onNotification(`Error: ${errorMsg}`, "error");
  } finally {
    setLaunchingProject(null);
  }
};
```

### Paso 3: Agregar Botón en el UI

En la lista de proyectos, agregar botón junto a los existentes:

```tsx
{
  /* Botón Reevaluar */
}
{
  /* ... código existente ... */
}

{
  /* Botón Lanzar Proyecto (NEW) */
}
{
  !project.contract_address && (
    <button
      onClick={() => handleLaunchProject(project.id, project.name)}
      disabled={evaluatingId === project.id || launchingProject === project.id}
      className="flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition"
      title="Lanzar proyecto - crear smart contract de escrow"
    >
      {launchingProject === project.id ? (
        <>
          <Loader size={16} className="animate-spin" />
          Lanzando...
        </>
      ) : (
        <>
          <Rocket size={16} />
          Lanzar
        </>
      )}
    </button>
  );
}

{
  /* Si ya tiene contract_address, mostrar diferente */
}
{
  project.contract_address && (
    <button
      disabled
      className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded-lg opacity-75"
    >
      <CheckCircle size={16} />
      Lanzado
    </button>
  );
}
```

### Paso 4: Mostrar Mensaje de Lanzamiento

```tsx
{
  launchMessage && (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-900 whitespace-pre-wrap">
        {launchMessage}
      </p>
    </div>
  );
}
```

### Paso 5: Agregar Icono Rocket

En imports:

```typescript
import { ..., Rocket, CheckCircle } from "lucide-react";
```

---

## 🔧 Backend Implementation

### Paso 1: Crear Archivo src/routes/v1/escrow.py

```python
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
from src.depends.db import get_async_session
from src.models.project import SponsoredProject
import httpx
import json

router = APIRouter()

# ============ Models ============

class MilestoneInput(BaseModel):
    percentage: int
    description: str

class DeployEscrowRequest(BaseModel):
    project_id: int
    total_budget: float
    milestones: List[MilestoneInput]

class DeployEscrowResponse(BaseModel):
    success: bool
    contract_address: str
    chain: str
    transaction_hash: str
    milestones: List[dict]

# ============ Endpoints ============

@router.post("/deploy-escrow")
async def deploy_escrow(
    request: DeployEscrowRequest,
    session: AsyncSession = Depends(get_async_session),
) -> DeployEscrowResponse:
    """
    Deployar smart contract escrow para un proyecto.

    Crea un escrow inteligente con:
    - Fondos divididos en hitos
    - Liberación progresiva según avance
    - Posibilidad de cancelación
    """

    try:
        # 1. Obtener proyecto de BD
        stmt = select(SponsoredProject).where(
            SponsoredProject.id == request.project_id
        )
        result = await session.execute(stmt)
        project = result.scalars().first()

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # 2. Validar que el proyecto está aprobado
        if project.status != "approved":
            raise HTTPException(
                status_code=400,
                detail=f"Project must be approved, current status: {project.status}"
            )

        # 3. Validar que los porcentajes suman 100
        total_percentage = sum(m.percentage for m in request.milestones)
        if total_percentage != 100:
            raise HTTPException(
                status_code=400,
                detail=f"Milestone percentages must sum to 100, got {total_percentage}"
            )

        # 4. Validar que ya no tiene contract
        if project.contract_address:
            raise HTTPException(
                status_code=400,
                detail="Project already has a contract address"
            )

        # 5. Preparar datos para smart contract
        milestone_descriptions = [m.description.encode('utf-8') for m in request.milestones]
        milestone_percentages = [m.percentage for m in request.milestones]

        # 6. Llamar al smart contract (via RPC)
        contract_address = await deploy_contract_to_chain(
            project_id=str(project.project_id),
            project_name=project.name,
            total_budget=request.total_budget,
            milestone_percentages=milestone_percentages,
            milestone_descriptions=milestone_descriptions,
        )

        # 7. Guardar contract_address en BD
        project.contract_address = contract_address
        project.chain = "rococo"  # O el chain que uses
        session.add(project)
        await session.commit()

        # 8. Actualizar Arkiv (TODO)
        # await update_arkiv_with_contract(...)

        # 9. Retornar respuesta
        return DeployEscrowResponse(
            success=True,
            contract_address=contract_address,
            chain="rococo",
            transaction_hash="0x1234...abcd",  # Implementar después
            milestones=[
                {
                    "index": i,
                    "percentage": m.percentage,
                    "amount": (request.total_budget / 100) * m.percentage,
                    "description": m.description,
                    "status": "pending"
                }
                for i, m in enumerate(request.milestones)
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def deploy_contract_to_chain(
    project_id: str,
    project_name: str,
    total_budget: float,
    milestone_percentages: List[int],
    milestone_descriptions: List[bytes],
) -> str:
    """
    Llamar al nodo Polkadot para deployar el smart contract.

    IMPORTANTE: Requiere:
    1. Nodo Rococo corriendo o RPC disponible
    2. Cuenta con fondos (para pagar gas)
    3. Binario del contrato compilado (funding_escrow.wasm)
    """

    # TODO: Implementar conexión con Polkadot RPC via subxt
    # Por ahora retornamos una dirección simulada para testing

    contract_address = "0x" + "abcd1234" * 8

    # Simular que se creó
    print(f"✅ Smart Contract deployado para {project_name}")
    print(f"   Presupuesto: ${total_budget}")
    print(f"   Contract Address: {contract_address}")

    return contract_address
```

### Paso 2: Registrar Endpoint en main.py

```python
from src.routes.v1.escrow import router as escrow_router

# ... en la sección donde registras routers ...

app.include_router(escrow_router, prefix="/api/v1", tags=["escrow"])
```

### Paso 3: Agregar método en ProjectService

```typescript
// frontend/src/services/projectService.ts

static async deployEscrow(
  projectId: number,
  totalBudget: number,
  milestones: Array<{
    percentage: number;
    description: string;
  }>
): Promise<any> {
  const response = await fetch(
    `${API_BASE}/deploy-escrow`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        total_budget: totalBudget,
        milestones,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Deployment failed");
  }

  return response.json();
}
```

---

## 🧪 Testing del Flujo

### Test 1: Deploy Local

```bash
# Verificar que el endpoint responde
curl -X POST http://localhost:8000/api/v1/deploy-escrow \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "total_budget": 10000,
    "milestones": [
      {"percentage": 25, "description": "Fase 1"},
      {"percentage": 25, "description": "Fase 2"},
      {"percentage": 25, "description": "Fase 3"},
      {"percentage": 25, "description": "Fase 4"}
    ]
  }'
```

### Test 2: Frontend Click

1. Ir a Arkiv Projects
2. Ver botón "🚀 Lanzar" en proyecto aprobado
3. Click en botón
4. Confirmar en dialog
5. Ver mensajes de progreso
6. Ver "✅ Lanzado" cuando se completa

### Test 3: BD

Verificar que `sponsoredproject.contract_address` está guardado:

```sql
SELECT id, name, status, contract_address
FROM sponsoredproject
WHERE id = 1;
```

---

## 📊 Estado de Implementación

| Componente              | Estado       | Notas                                               |
| ----------------------- | ------------ | --------------------------------------------------- |
| SC Compilado            | ⏳ Por hacer | Ejecutar: `cargo +nightly contract build --release` |
| Endpoint /deploy-escrow | ⏳ Por hacer | Crear src/routes/v1/escrow.py                       |
| Frontend Button         | ⏳ Por hacer | Agregar handleLaunchProject en ProjectsListView     |
| BD Schema               | ✅ OK        | contract_address ya existe en sponsoredproject      |
| Testing                 | ⏳ Por hacer | Tests unitarios del SC                              |

---

## 🎯 Próximos Pasos

1. **Compilar SC**

   ```bash
   cd smart-contract/funding-escrow
   cargo +nightly contract build --release
   ```

2. **Testear SC**

   ```bash
   cargo +nightly contract test
   ```

3. **Implementar Endpoint**

   - Crear `src/routes/v1/escrow.py`
   - Agregar en `src/main.py`

4. **Implementar Frontend**

   - Agregar en `ProjectsListView.tsx`
   - Agregar método en `projectService.ts`

5. **Testear Flujo Completo**
   - Click "Lanzar"
   - Verificar contract_address en BD
   - Verificar en Arkiv

---

**Status:** Listos para empezar 🚀

Próximo comando:

```bash
cd smart-contract/funding-escrow
cargo +nightly contract build --release
```
