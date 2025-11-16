# 🚀 Guía de Continuación - Smart Contract Funding Escrow

## Estado Actual (16 Nov 2025)

✅ **Completado:**

- Smart contract completamente implementado (600+ líneas)
- Documentación técnica completa
- Estructura del proyecto lista

⏳ **Pendiente:**

- Compilar el contrato
- Implementar endpoints en backend
- Integrar en frontend
- Deploy en testnet

---

## 📋 Instrucciones para Continuar

### Paso 1: Compilar el Smart Contract (10 min)

**Requisitos previos:**

```bash
# Verificar que tienes Rust instalado
rustc --version

# Si no lo tienes, instalar:
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Agregar nightly
rustup toolchain install nightly
rustup target add wasm32-unknown-unknown --toolchain nightly

# Instalar cargo-contract
cargo +nightly install cargo-contract --locked
```

**Compilar:**

```bash
cd smart-contract/funding-escrow
cargo +nightly contract build --release

# Verás esto al final:
# Your contract artifacts are ready. You can find them in:
# target/ink/
#   - funding_escrow.wasm
#   - funding_escrow.json
#   - funding_escrow.opt.wasm
```

### Paso 2: Implementar Endpoint `/deploy-escrow` en Backend (30-45 min)

**Crear archivo:** `src/routes/v1/escrow.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import httpx

router = APIRouter()

# ============ Models/Schemas ============

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
    Deployar smart contract escrow para un proyecto aprobado.

    Este endpoint:
    1. Valida que el proyecto existe
    2. Calcula montos de cada hito
    3. Crea la transacción del SC
    4. Guarda contract_address en BD
    5. Actualiza Arkiv con el contract_address
    """

    try:
        # 1. Obtener proyecto de BD
        stmt = select(SponsoredProject).where(
            SponsoredProject.project_id == str(request.project_id)
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

        # 4. Preparar datos para el smart contract
        milestone_descriptions = [m.description.encode() for m in request.milestones]
        milestone_percentages = [m.percentage for m in request.milestones]

        # 5. Llamar al RPC de Polkadot para deployar
        # NOTA: Esto requiere configurar conexión con nodo Rococo
        contract_address = await deploy_contract_to_chain(
            project_id=str(request.project_id),
            project_name=project.name,
            total_budget=request.total_budget,
            milestone_percentages=milestone_percentages,
            milestone_descriptions=milestone_descriptions,
        )

        # 6. Guardar contract_address en BD
        project.contract_address = contract_address
        project.chain = "rococo"  # O el chain que uses
        session.add(project)
        await session.commit()

        # 7. Actualizar en Arkiv
        await update_arkiv_with_contract(
            project_id=str(request.project_id),
            contract_address=contract_address,
        )

        # 8. Retornar respuesta
        return DeployEscrowResponse(
            success=True,
            contract_address=contract_address,
            chain="rococo",
            transaction_hash="0x...",  # Hash de la transacción
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

    # TODO: Implementar llamada a subxt
    # Por ahora retornamos una dirección de ejemplo
    contract_address = "0x" + "1234abcd" * 8
    return contract_address


@router.post("/release-milestone")
async def release_milestone(
    project_id: int,
    milestone_index: int,
    session: AsyncSession = Depends(get_async_session),
):
    """Liberar fondos de un hito completado."""

    # TODO: Implementar lógica para llamar release_milestone en SC
    pass


@router.post("/record-progress")
async def record_progress(
    project_id: int,
    milestone_index: int,
    progress_notes: str,
    session: AsyncSession = Depends(get_async_session),
):
    """Registrar progreso del proyecto."""

    # TODO: Implementar lógica para llamar record_progress en SC
    pass


@router.get("/escrow/{project_id}")
async def get_escrow_status(
    project_id: int,
    session: AsyncSession = Depends(get_async_session),
):
    """Obtener estado del escrow de un proyecto."""

    # TODO: Implementar query a SC para obtener estado
    pass
```

**Luego en `src/main.py` agregar:**

```python
from src.routes.v1.escrow import router as escrow_router

# ... otros imports ...

app.include_router(escrow_router, prefix="/api/v1", tags=["escrow"])
```

### Paso 3: Integración en Frontend (20-30 min)

**En `frontend/src/services/projectService.ts` agregar:**

```typescript
// Agregar método para deployar escrow
export class ProjectService {
  // ... métodos existentes ...

  static async deployEscrow(
    projectId: number,
    totalBudget: number,
    milestones: Array<{
      percentage: number;
      description: string;
    }>
  ) {
    const response = await fetch(`${API_BASE}/deploy-escrow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        total_budget: totalBudget,
        milestones,
      }),
    });

    if (!response.ok) throw new Error("Deployment failed");
    return response.json();
  }

  static async releaseMilestone(projectId: number, milestoneIndex: number) {
    const response = await fetch(`${API_BASE}/release-milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        milestone_index: milestoneIndex,
      }),
    });

    if (!response.ok) throw new Error("Release failed");
    return response.json();
  }

  static async recordProgress(
    projectId: number,
    milestoneIndex: number,
    progressNotes: string
  ) {
    const response = await fetch(`${API_BASE}/record-progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        milestone_index: milestoneIndex,
        progress_notes: progressNotes,
      }),
    });

    if (!response.ok) throw new Error("Progress recording failed");
    return response.json();
  }
}
```

### Paso 4: Modificar Flujo de Aprobación (15-20 min)

**En `ModerationView.tsx` actualizar `handleApprove()`:**

```typescript
const handleApprove = async (projectId: number, projectName: string) => {
  try {
    // 1. Cambiar status a aprobado
    await ProjectService.updateSponsored(projectId, {
      status: "approved",
    });

    // 2. Deployar escrow con hitos
    // IMPORTANTE: Necesitas definir los hitos
    const defaultMilestones = [
      { percentage: 25, description: "Fase 1: Prototipo" },
      { percentage: 25, description: "Fase 2: Beta Testing" },
      { percentage: 25, description: "Fase 3: Producción" },
      { percentage: 25, description: "Fase 4: Soporte" },
    ];

    const escrowResult = await ProjectService.deployEscrow(
      projectId,
      selectedProject?.budget || 0,
      defaultMilestones
    );

    // 3. Actualizar proyecto con contract_address
    await ProjectService.updateSponsored(projectId, {
      contract_address: escrowResult.contract_address,
    });

    onNotification(
      `✅ Proyecto aprobado y escrow creado: ${escrowResult.contract_address}`,
      "success"
    );

    // 4. Refrescar lista
    await fetchPendingProjects();
  } catch (err) {
    onNotification(
      `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
      "error"
    );
  }
};
```

---

## 📚 Referencias

| Archivo                          | Propósito                  |
| -------------------------------- | -------------------------- |
| `FUNDING_ESCROW.md`              | Docs técnicas del contrato |
| `SETUP.md`                       | Setup y compilación        |
| `SMART_CONTRACT_ARCHITECTURE.md` | Arquitectura general       |
| `integration_flow.rs`            | Ejemplo de integración     |

---

## 🔗 Links Útiles

- [ink! Documentation](https://docs.rs/ink/latest/ink/)
- [Polkadot RPC](https://polkadot.js.org/)
- [Rococo Testnet](https://rococo.network/)
- [subxt - Rust RPC Client](https://github.com/paritytech/subxt)

---

## ⚠️ Cosas Importantes

1. **Compilación del SC**

   - Requiere Rust nightly
   - La primera compilación tarda ~5 min
   - Genera 3 archivos: .wasm, .json, .opt.wasm

2. **Configuración de Polkadot**

   - Necesitas RPC URL de Rococo o tu propia red
   - La cuenta que deploy necesita fondos (DOT)

3. **Seguridad**

   - NO guardes private keys en el código
   - Usa variables de entorno
   - Valida siempre que el proyecto está aprobado

4. **Testing**
   - Test local antes de deployar
   - Usa Rococo testnet primero
   - No uses fondos reales hasta estar seguro

---

## 🆘 Troubleshooting

### Error: `cargo contract not found`

```bash
cargo +nightly install cargo-contract --locked
```

### Error: `wasm32-unknown-unknown target not found`

```bash
rustup target add wasm32-unknown-unknown --toolchain nightly
```

### Error de Compilación del SC

Verifica que tienes:

- ✅ Rust nightly instalado
- ✅ ink! dependencies en Cargo.toml
- ✅ Anotaciones correctas (`#[ink::contract]`, etc)

---

**Próximo Paso:** Compilar el Smart Contract 🎯
