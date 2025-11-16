# Sistema de Fondos con Liberación Progresiva - Arquitectura Completa

## 📋 Overview

Sistema Web3 de financiamiento de proyectos con **escrow inteligente** que libera fondos progresivamente según hitos completados.

**Componentes:**
1. **Frontend** (React/TypeScript) - Interfaz de usuario
2. **Backend** (FastAPI/Python) - API REST
3. **Smart Contract** (ink!/Polkadot) - Escrow de fondos
4. **Blockchain** (Arkiv) - Registro inmutable de proyectos y progreso
5. **Base de Datos** (PostgreSQL) - Persistencia

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Submit    │  │ Moderación   │  │  Arkiv Projects     │   │
│  │   Projects  │  │   (Revisar)  │  │  (Aprobados)        │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
└──────┬────────────────────┬─────────────────────┬───────────────┘
       │                    │                     │
       ├─ POST /projects    │                     │
       │                    │                     │
       │  POST /approve ────┼─ Crear Escrow      │
       │  (Deploy SC)       │  (Smart Contract)  │
       │                    │                     │
       │                    │  release_milestone/ │
       │                    │  record_progress    │
       │                    ▼                     │
       │             ┌──────────────────┐        │
       │             │  SMART CONTRACT   │        │
       │             │  (Polkadot/ink!)  │        │
       │             │                   │        │
       │             │  - Escrow         │        │
       │             │  - Milestones     │        │
       │             │  - Release Funds  │        │
       │             │  - Progress       │        │
       │             └──────┬───────┬────┘        │
       │                    │       │             │
       │        Events:     │       ▼ Moneda      │
       │        - Created   │       liberada      │
       │        - Released  │       ($$$)         │
       │        - Progress  │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Rutas:                                                       │ │
│  │ - POST /projects (crear proyecto)                           │ │
│  │ - POST /approve (aprobar + deployar escrow)                 │ │
│  │ - POST /deploy-escrow (instanciar SC)                       │ │
│  │ - POST /release-milestone (liberar fondos)                  │ │
│  │ - POST /record-progress (registrar avance)                  │ │
│  │ - GET /sponsored (obtener proyectos)                        │ │
│  │ - GET /escrow/{project_id} (estado del escrow)              │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────┬────────────────────┬──────────────────────┬────────────────┘
       │                    │                      │
       │ Escucha eventos    │                      │
       │ del SC             │                      │
       │                    ▼                      │
       │             ┌──────────────┐             │
       │             │  ARKIV Node   │             │
       │             │  (Blockchain) │             │
       │             │               │             │
       │             │ - Proyectos   │             │
       │             │ - Hitos       │             │
       │             │ - Progreso    │             │
       │             │ - Contract    │             │
       │             │   Address     │             │
       │             └──────────────┘             │
       │                    ▲                      │
       │                    │                      │
       │             Actualiza entidades          │
       │             con progreso                 │
       │                    │                      │
       └────────────────────┼──────────────────────┘
                            │
                            ▼
                ┌──────────────────────┐
                │   PostgreSQL         │
                │   ┌────────────────┐ │
                │   │ projects       │ │
                │   │ milestones     │ │
                │   │ sponsored      │ │
                │   │ sponsoredproj  │ │
                │   └────────────────┘ │
                └──────────────────────┘
```

---

## 📊 Flujo de Datos

### Fase 1: Crear Proyecto

```
User (Frontend)
     │
     ├─ Completa formulario
     ├─ POST /projects
     │
     ▼
Backend
     ├─ Valida datos
     ├─ Calcula AI score
     ├─ Guarda en BD (status="submitted")
     ├─ Registra en Arkiv
     │
     ▼
PostgreSQL + Arkiv
     └─ Proyecto almacenado (pendiente revisión)
```

### Fase 2: Moderar Proyecto

```
Moderator (Frontend - Moderación tab)
     │
     ├─ Ve todos los proyectos
     ├─ Reevalúa con AI
     ├─ Aprueba/Rechaza
     │
     ▼
Backend (/approve endpoint)
     ├─ Valida decisión
     ├─ Actualiza BD (status="approved")
     ├─ Registra en Arkiv
     │
     ├─ Si es aprobado:
     │  ├─ POST /deploy-escrow
     │  │
     │  ▼
     │  Smart Contract
     │  ├─ Recibe fondos (DOT)
     │  ├─ Crea N hitos
     │  ├─ Almacena metadatos
     │  ├─ Emite: EscrowCreated
     │  │
     │  ▼
     │  Backend (escucha evento)
     │  ├─ Extrae contract_address
     │  ├─ Guarda en BD
     │  ├─ Actualiza Arkiv
     │  │
     │  ▼
     │  PostgreSQL
     │  └─ sponsoredproject.contract_address = "0x..."
     │
     └─ Proyecto aprobado
```

### Fase 3: Avanzar Proyecto

```
Project Owner (Frontend - Arkiv Projects)
     │
     ├─ Completa hito 1
     ├─ Registra progreso (record_progress)
     │
     ▼
Smart Contract
     ├─ Recibe: record_progress(0, "Completamos...")
     ├─ Valida que es el project_owner
     ├─ Emite: ProgressRecorded
     │
     ▼
Backend (escucha evento)
     ├─ Actualiza Arkiv con progreso
     ├─ Notifica al admin/moderador
     │
     ▼
Admin (Frontend - Arkiv Projects)
     │
     ├─ Ve progreso en Arkiv
     ├─ Verifica que es válido
     ├─ Ejecuta: release_milestone(0)
     │
     ▼
Smart Contract
     ├─ Transfiere $2,500 al project_owner
     ├─ Marca hito como liberado
     ├─ Emite: FundsReleased
     │
     ▼
Backend + PostgreSQL + Arkiv
     ├─ Actualiza: released_amount = 2500
     ├─ Actualiza Arkiv: hito_status = "released"
     │
     ▼
Project Owner
     └─ Recibe $2,500 ✅
```

### Fase 4: Ciclo Completo o Cancelación

**Escenario A: Todos los hitos completados**
```
Hito 2, 3, 4 completados...
     │
     ├─ Cada uno sigue el proceso de Fase 3
     │
     ▼
Smart Contract
     ├─ Release Hito 4
     ├─ Verifica: ¿Todos liberados?
     ├─ Marca: is_completed = true
     ├─ Emite: EscrowCompleted
     │
     ▼
Proyecto FINALIZADO ✅ (todos recibieron fondos)
```

**Escenario B: Sin progreso → Cancelación**
```
Admin (tiempo después, sin actividad)
     │
     ├─ Ejecuta: cancel_escrow()
     │
     ▼
Smart Contract
     ├─ Transfiere FONDOS RESTANTES al admin
     ├─ Marca: is_cancelled = true
     ├─ Emite: EscrowCancelled
     │
     ▼
Backend + Arkiv
     ├─ Actualiza: escrow_status = "cancelled"
     │
     ▼
Proyecto CANCELADO ❌ (admin recupera fondos no liberados)
```

---

## 🗄️ Esquema de Base de Datos

### Tabla: `sponsoredproject`

```sql
CREATE TABLE sponsoredproject (
    id SERIAL PRIMARY KEY,
    project_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50),              -- submitted, approved, rejected, cancelled, completed
    ai_score NUMERIC(3, 2),          -- 0.00 - 1.00
    contract_address VARCHAR(255),   -- Dirección del SC (cuando es aprobado)
    chain VARCHAR(50),               -- "polkadot", "rococo", "shibuya"
    budget NUMERIC(15, 2),           -- Presupuesto en USD
    description TEXT,
    _entity_key VARCHAR(255),        -- Hash de Arkiv
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🔗 Integración Arkiv

### Estructura de Entidad Proyecto en Arkiv

```json
{
  "entity_type": "Project",
  "project_id": "proj_123",
  "project_name": "My App",
  "description": "...",
  "budget": 10000,
  "status": "approved",
  "contract_address": "0x1234...abcd",
  "chain": "rococo",
  "milestones": [
    {
      "index": 0,
      "name": "Prototipo",
      "percentage": 25,
      "amount": 2500,
      "status": "pending",     // pending, in_progress, completed, released
      "progress_notes": "",
      "released_at": null
    },
    {
      "index": 1,
      "name": "Beta",
      "percentage": 25,
      "amount": 2500,
      "status": "pending",
      "progress_notes": "",
      "released_at": null
    },
    ...
  ],
  "total_released": 2500,
  "total_remaining": 7500,
  "created_at": "2025-11-16T...",
  "updated_at": "2025-11-16T..."
}
```

### Eventos Arkiv desde Smart Contract

```
ProgressRecorded
├─ project_id: "proj_123"
├─ milestone_index: 0
├─ progress_notes: "Completamos fase 1 - prototipo funcional"
├─ timestamp: 1234567890
└─ contract_address: "0x1234...abcd"

      ↓ Backend escucha

Actualiza en Arkiv:
├─ milestones[0].status = "completed"
├─ milestones[0].progress_notes = "..."
└─ milestones[0].completed_at = timestamp

---

FundsReleased
├─ project_id: "proj_123"
├─ milestone_index: 0
├─ amount: 2500
├─ timestamp: 1234567890
└─ contract_address: "0x1234...abcd"

      ↓ Backend escucha

Actualiza en Arkiv:
├─ milestones[0].status = "released"
├─ milestones[0].released_at = timestamp
└─ total_released = 2500
```

---

## 🚀 Endpoints Backend Nuevos

### 1. Deploy Escrow
```
POST /deploy-escrow
Content-Type: application/json

{
  "project_id": 123,
  "total_budget": 10000,
  "milestones": [
    {
      "percentage": 25,
      "description": "Fase 1: Prototipo"
    },
    {
      "percentage": 25,
      "description": "Fase 2: Beta"
    },
    {
      "percentage": 25,
      "description": "Fase 3: Producción"
    },
    {
      "percentage": 25,
      "description": "Fase 4: Soporte"
    }
  ]
}

Response:
{
  "success": true,
  "contract_address": "0x1234...abcd",
  "chain": "rococo",
  "transaction_hash": "0x...",
  "milestones": [
    {
      "index": 0,
      "amount": 2500,
      "status": "pending"
    }
  ]
}
```

### 2. Liberar Fondo de Hito
```
POST /release-milestone
Content-Type: application/json

{
  "project_id": 123,
  "milestone_index": 0
}

Response:
{
  "success": true,
  "milestone_index": 0,
  "amount_released": 2500,
  "transaction_hash": "0x...",
  "remaining": 7500
}
```

### 3. Registrar Progreso
```
POST /record-progress
Content-Type: application/json

{
  "project_id": 123,
  "milestone_index": 0,
  "progress_notes": "Completamos prototipo - disponible en https://..."
}

Response:
{
  "success": true,
  "recorded_at": "2025-11-16T...",
  "event_hash": "0x..."
}
```

### 4. Obtener Estado de Escrow
```
GET /escrow/123

Response:
{
  "project_id": 123,
  "contract_address": "0x1234...abcd",
  "status": "active",              // active, completed, cancelled
  "total_amount": 10000,
  "released_amount": 2500,
  "remaining_amount": 7500,
  "milestones": [
    {
      "index": 0,
      "description": "Fase 1: Prototipo",
      "percentage": 25,
      "amount": 2500,
      "is_released": true,
      "released_at": "2025-11-16T..."
    },
    {
      "index": 1,
      "description": "Fase 2: Beta",
      "percentage": 25,
      "amount": 2500,
      "is_released": false,
      "released_at": null
    }
  ]
}
```

---

## 🛡️ Seguridad

- ✅ Smart Contract verificando `project_owner` para `record_progress`
- ✅ Smart Contract verificando `admin` para `release_milestone`
- ✅ Smart Contract verificando que fondos se transfieran correctamente
- ✅ Backend validando que solo moderadores pueden aprobar
- ✅ Backend validando que fondos existan antes de deployar
- ✅ Arkiv almacenando registro inmutable de todos los eventos
- ✅ Auditoría completa de transferencias en blockchain

---

## 📝 Próximos Pasos

1. **Compilar Smart Contract**
   ```bash
   cd smart-contract/funding-escrow
   cargo +nightly contract build --release
   ```

2. **Deployar a Rococo Testnet**
   - Usar Polkadot.js Apps
   - O crear script de deployment

3. **Implementar Endpoints Backend**
   - `/deploy-escrow`
   - `/release-milestone`
   - `/record-progress`
   - `/escrow/{project_id}`

4. **Integrar en Frontend**
   - Mostrar hitos en Arkiv Projects
   - Botón para liberar fondos (solo admin)
   - Mostrar estado del escrow

5. **Escuchar Eventos Smart Contract**
   - Setup de listener para eventos
   - Actualizar Arkiv en tiempo real
   - Notificaciones en tiempo real

---

## 📚 Documentación Completa

- [Smart Contract Docs](./smart-contract/FUNDING_ESCROW.md)
- [Setup e Instalación](./smart-contract/funding-escrow/SETUP.md)
- [Ejemplos de Integración](./smart-contract/funding-escrow/examples/integration_flow.rs)
