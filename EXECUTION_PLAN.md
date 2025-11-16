# 🚀 Plan de Ejecución Final - Smart Contract + Botón Lanzar

## 📌 Resumen General

El sistema completo tiene 5 fases:

```
Fase 1: Compilar SC           ✅ Ready (comando preparado)
   ↓
Fase 2: Testear SC            ✅ Ready (tests listos)
   ↓
Fase 3: Deploy a Rococo       ✅ Ready (instrucciones listas)
   ↓
Fase 4: Implementar Backend   ✅ Ready (código disponible)
   ↓
Fase 5: Implementar Frontend  ✅ Ready (código disponible)
```

---

## 🎯 Orden de Ejecución

### FASE 1: Compilación del Smart Contract (10 minutos)

**Objetivo:** Generar los archivos .wasm y .json

**Comandos:**

```bash
# 1. Navegar al directorio del SC
cd /Users/facundo/Proyectos-VSC/Sub0_data/smart-contract/funding-escrow

# 2. Compilar (release = optimizado)
cargo +nightly contract build --release

# 3. Verificar que se generaron los archivos
ls -la target/ink/
# Deberías ver:
# - funding_escrow.wasm (bytecode)
# - funding_escrow.json (metadata)
# - funding_escrow.opt.wasm (optimizado)
```

**Documentación:** [COMPILE_AND_TEST.md](smart-contract/COMPILE_AND_TEST.md)

**Próximo paso:** Fase 2

---

### FASE 2: Ejecutar Tests Unitarios (5 minutos)

**Objetivo:** Verificar que el código no tiene errores

**Comandos:**

```bash
# Desde smart-contract/funding-escrow/
cargo +nightly contract test

# Salida esperada:
# test result: ok. X passed; 0 failed; 0 ignored
```

**Documentación:** [COMPILE_AND_TEST.md](smart-contract/COMPILE_AND_TEST.md) → Paso 3

**Próximo paso:** Fase 3 o Fase 4 (pueden ser paralelas)

---

### FASE 3: Deploy a Rococo Testnet (20-30 minutos)

**Objetivo:** Subir el contrato a la red de prueba

**Opción A: GUI (Recomendada para primer test)**

```
1. Ir a: https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-contracts-rpc.polkadot.io
2. Conectar wallet (crear una nueva o usar existente)
3. Conseguir ROC: https://rococo-faucet.vercel.app/
4. Developers → Contracts → Upload Contract
5. Seleccionar target/ink/funding_escrow.wasm
6. Seleccionar target/ink/funding_escrow.json
7. Firmar y confirmar
```

**Opción B: Script Python (Automatizado)**

```bash
python3 scripts/deploy_contract.py
```

**Documentación:** [COMPILE_AND_TEST.md](smart-contract/COMPILE_AND_TEST.md) → Paso 4

**Próximo paso:** Fase 4

---

### FASE 4A: Implementar Endpoint Backend (45 minutos)

**Objetivo:** Crear `/deploy-escrow` que instancia el SC

**Archivos a crear/modificar:**

1. **Crear:** `src/routes/v1/escrow.py`

   ```python
   # Ver LAUNCH_PROJECT_BUTTON.md para código completo
   ```

2. **Modificar:** `src/main.py`

   ```python
   from src.routes.v1.escrow import router as escrow_router
   app.include_router(escrow_router, prefix="/api/v1", tags=["escrow"])
   ```

3. **Modificar:** `frontend/src/services/projectService.ts`
   ```typescript
   static async deployEscrow(...) { ... }
   ```

**Documentación:** [LAUNCH_PROJECT_BUTTON.md](LAUNCH_PROJECT_BUTTON.md) → Backend Implementation

**Comando para verificar:**

```bash
# Con backend corriendo, probar endpoint
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

**Próximo paso:** Fase 4B

---

### FASE 4B: Implementar Servicio Frontend (30 minutos)

**Objetivo:** Agregar método `deployEscrow()` en ProjectService

**Archivo:** `frontend/src/services/projectService.ts`

**Código:**

```typescript
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

**Próximo paso:** Fase 5

---

### FASE 5: Implementar UI Frontend (60 minutos)

**Objetivo:** Agregar botón "🚀 Lanzar Proyecto" en ProjectsListView

**Archivo:** `frontend/src/components/FundingOracle/ProjectsListView.tsx`

**Cambios:**

1. **Agregar imports:**

   ```typescript
   import { ..., Rocket, CheckCircle } from "lucide-react";
   ```

2. **Agregar estados:**

   ```typescript
   const [launchingProject, setLaunchingProject] = useState<number | null>(
     null
   );
   const [launchMessage, setLaunchMessage] = useState<string | null>(null);
   ```

3. **Agregar función:**

   ```typescript
   const handleLaunchProject = async (
     projectId: number,
     projectName: string
   ) => {
     // Ver código completo en LAUNCH_PROJECT_BUTTON.md
   };
   ```

4. **Agregar botón en el render:**

   ```tsx
   {
     !project.contract_address && (
       <button
         onClick={() => handleLaunchProject(project.id, project.name)}
         disabled={launchingProject === project.id}
         className="flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg"
       >
         {launchingProject === project.id ? (
           <>
             <Loader size={16} className="animate-spin" /> Lanzando...
           </>
         ) : (
           <>
             <Rocket size={16} /> Lanzar
           </>
         )}
       </button>
     );
   }
   ```

5. **Mostrar estado "Lanzado":**
   ```tsx
   {
     project.contract_address && (
       <button
         disabled
         className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded-lg"
       >
         <CheckCircle size={16} /> Lanzado
       </button>
     );
   }
   ```

**Documentación:** [LAUNCH_PROJECT_BUTTON.md](LAUNCH_PROJECT_BUTTON.md) → Frontend Implementation

**Próximo paso:** Testing

---

## 🧪 Testing Completo

### Test 1: Verificar Compilación ✅

```bash
cd smart-contract/funding-escrow
ls -la target/ink/
# Deberías ver los 3 archivos
```

### Test 2: Verificar Tests ✅

```bash
cargo +nightly contract test
# Resultado: ok
```

### Test 3: Backend Endpoint ✅

```bash
# Terminal 1: Backend corriendo
cd /Users/facundo/Proyectos-VSC/Sub0_data
.venv/bin/python3 -m uvicorn src.main:app --reload

# Terminal 2: Probar endpoint
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

# Respuesta esperada:
# {"success": true, "contract_address": "0x...", ...}
```

### Test 4: Frontend ✅

```bash
# Terminal 3: Frontend corriendo
cd /Users/facundo/Proyectos-VSC/Sub0_data/frontend
npm run dev

# Ir a http://localhost:5173
# 1. Navegar a "Proyectos en Arkiv"
# 2. Ver botón "🚀 Lanzar" en proyecto aprobado
# 3. Click en botón
# 4. Confirmar en dialog
# 5. Ver mensaje "✅ Proyecto lanzado"
# 6. Botón cambia a "Lanzado"
```

### Test 5: BD ✅

```bash
# Verificar que contract_address se guardó
SELECT id, name, status, contract_address
FROM sponsoredproject
WHERE id = 1;

# Deberías ver:
# id | name | status | contract_address
# 1  | Test | approved | 0x...
```

---

## 📊 Checklist Completo

### Preparación

- ✅ Smart contract implementado (600+ líneas)
- ✅ Documentación completa
- ✅ Requisitos verificados

### Compilación

- ⏳ Ejecutar: `cargo +nightly contract build --release`
- ⏳ Verificar: 3 archivos en `target/ink/`

### Testing

- ⏳ Ejecutar: `cargo +nightly contract test`
- ⏳ Resultado: todos los tests pasan

### Deployment Testnet

- ⏳ Conseguir ROC (testnet tokens)
- ⏳ Upload contrato a Rococo
- ⏳ Obtener contract_address

### Backend

- ⏳ Crear `src/routes/v1/escrow.py`
- ⏳ Agregar router en `main.py`
- ⏳ Verificar endpoint `/deploy-escrow`

### Frontend

- ⏳ Agregar `deployEscrow()` en ProjectService
- ⏳ Agregar `handleLaunchProject()` en ProjectsListView
- ⏳ Agregar botón "🚀 Lanzar"
- ⏳ Agregar estado "Lanzado"

### Testing E2E

- ⏳ Test botón en UI
- ⏳ Test endpoint backend
- ⏳ Verificar BD
- ⏳ Verificar contract_address

---

## 🕐 Tiempo Estimado

| Fase      | Actividad        | Tiempo       |
| --------- | ---------------- | ------------ |
| 1         | Compilar SC      | 10 min       |
| 2         | Testing SC       | 5 min        |
| 3         | Deploy Rococo    | 20 min       |
| 4A        | Backend endpoint | 45 min       |
| 4B        | Frontend service | 30 min       |
| 5         | Frontend UI      | 60 min       |
| Test      | Testing completo | 30 min       |
| **Total** | **Todo**         | **~3 horas** |

---

## 🚨 Cosas Importantes

1. **Requisitos:**

   - ✅ Rust nightly instalado
   - ✅ cargo-contract instalado
   - ✅ Node.js 24.7.0 (ya configurado)
   - ✅ Python 3.12 (ya configurado)

2. **Fondos:**

   - Necesitas ROC para testnet (gratis)
   - Faucet: https://rococo-faucet.vercel.app/

3. **Pruebas:**

   - Test en Rococo primero (testnet)
   - NO uses mainnet sin estar 100% seguro

4. **Seguridad:**
   - Valida siempre que proyecto está "approved"
   - Verifica que los porcentajes sumen 100
   - Maneja errores gracefully

---

## 📚 Documentación de Referencia

| Documento                        | Propósito                    |
| -------------------------------- | ---------------------------- |
| `COMPILE_AND_TEST.md`            | Compilación y testing del SC |
| `LAUNCH_PROJECT_BUTTON.md`       | Botón y flujo completo       |
| `SMART_CONTRACT_ARCHITECTURE.md` | Arquitectura general         |
| `FUNDING_ESCROW.md`              | Docs técnicas del SC         |
| `SETUP.md`                       | Setup de requisitos          |

---

## 🎯 Próximo Comando

Para empezar **AHORA**:

```bash
cd /Users/facundo/Proyectos-VSC/Sub0_data/smart-contract/funding-escrow
cargo +nightly contract build --release
```

⏱️ Esto tardará ~2-3 minutos en la primera compilación.

---

**Status:** ✅ Todo listo para ejecutar

**Recomendación:** Ejecutar en orden (Fase 1 → 2 → 3 → 4 → 5)

**Duración estimada:** 3 horas

**Fecha:** 16 de Noviembre de 2025
