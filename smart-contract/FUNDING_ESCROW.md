# Smart Contract: Funding Escrow (Polkadot / ink!)

## Overview

Smart contract de **escrow con liberación progresiva de fondos** para proyectos financiados. El contrato administra la liberación de fondos en hitos (milestones) según el progreso del proyecto.

## Características Principales

### 1. **Creación de Escrow**

```rust
create_escrow(
    project_owner: AccountId,
    project_id: Vec<u8>,
    project_name: Vec<u8>,
    description: Vec<u8>,
    arkiv_entity_url: Vec<u8>,
    milestone_percentages: Vec<u32>,  // [20, 30, 50] = 100%
    milestone_descriptions: Vec<Vec<u8>>
)
```

**Ejemplo**: Proyecto solicita $10,000 con 4 hitos:

- Hito 1 (25%): $2,500 - Prototipo
- Hito 2 (25%): $2,500 - Beta testing
- Hito 3 (25%): $2,500 - Producción
- Hito 4 (25%): $2,500 - Soporte

### 2. **Liberación de Fondos**

```rust
release_milestone(milestone_index: u32) -> Result<(), EscrowError>
```

- Solo el **admin** (quien creó el escrow) puede liberar fondos
- Los fondos van directamente al `project_owner`
- Se registra timestamp de cuándo se liberaron
- Se emite evento `FundsReleased`

### 3. **Cancelación de Escrow**

```rust
cancel_escrow() -> Result<(), EscrowError>
```

- Solo el **admin** puede cancelar
- Devuelve los fondos **restantes** al admin
- Útil si el proyecto no avanza: "No estamos viendo progreso, cancelemos"
- Los fondos ya liberados no se recuperan

### 4. **Registro de Progreso (Arkiv Integration)**

```rust
record_progress(
    milestone_index: u32,
    progress_notes: Vec<u8>
)
```

- El `project_owner` registra progreso en cada hito
- Emite evento `ProgressRecorded` que Arkiv puede escuchar
- Vincula el progreso en blockchain con la entidad en Arkiv
- La información se serializa en la entidad de Arkiv

### 5. **Queries**

```rust
get_escrow(project_owner) -> EscrowInfo
get_milestone(project_owner, milestone_index) -> MilestoneInfo
get_project_metadata(project_owner) -> ProjectMetadataInfo
```

## Flujo Completo

### Frontend (React) → Backend (FastAPI) → Smart Contract

1. **Moderador aprueba proyecto en Moderación tab**

   ```
   POST /deploy-escrow
   {
     "project_id": 123,
     "total_budget": 10000,
     "milestones": [
       {"percentage": 25, "description": "Prototipo"},
       {"percentage": 25, "description": "Beta"},
       {"percentage": 25, "description": "Producción"},
       {"percentage": 25, "description": "Soporte"}
     ]
   }
   ```

2. **Backend (FastAPI)**

   - Recupera datos del proyecto de BD
   - Llama al contrato: `create_escrow(...)`
   - Guarda `contract_address` en `sponsoredproject.contract_address`
   - Retorna al frontend

3. **Smart Contract**

   - Recibe fondos ($10,000)
   - Crea 4 hitos de $2,500 cada uno
   - Almacena metadatos del proyecto
   - Emite evento `EscrowCreated`

4. **Project Owner (Beneficiario)**

   - Ve el proyecto aprobado en Arkiv tab
   - Puede ver hitos en el dashboard
   - Registra progreso: `record_progress(0, "Completamos prototipo")`

5. **Admin (Moderador/Sponsor)**

   - Ve el progreso en Arkiv
   - Cuando ve que el hito está completo, ejecuta: `release_milestone(0)`
   - $2,500 se transfieren al `project_owner`

6. **Ciclo**
   - Hito 2 completado → Registra progreso → Admin libera $2,500
   - Hito 3 completado → Registra progreso → Admin libera $2,500
   - Hito 4 completado → Registra progreso → Admin libera $2,500
   - Escrow completado

## Manejo de Errores

```rust
pub enum EscrowError {
    InsufficientFunds,              // No se envió dinero
    EscrowAlreadyExists,            // Ya existe escrow
    InvalidMilestonePercentages,    // Los % no suman 100
    MilestoneCountMismatch,         // Mismatch descripción/porcentajes
    EscrowNotFound,                 // No existe el escrow
    InvalidMilestoneIndex,          // Índice inválido
    MilestoneAlreadyReleased,       // Ya fue liberado
    TransferFailed,                 // Error en transferencia
    EscrowCancelled,                // Escrow fue cancelado
    EscrowCompleted,                // Escrow fue completado
    Unauthorized,                   // No autorizado
    CannotCancelEscrow,             // No se puede cancelar
}
```

## Eventos

### EscrowCreated

```rust
pub struct EscrowCreated {
    #[ink(topic)]
    project_owner: AccountId,
    total_amount: Balance,
    milestone_count: u32,
}
```

### FundsReleased

```rust
pub struct FundsReleased {
    #[ink(topic)]
    project_owner: AccountId,
    milestone_index: u32,
    amount: Balance,
}
```

### EscrowCancelled

```rust
pub struct EscrowCancelled {
    #[ink(topic)]
    project_owner: AccountId,
    remaining_amount: Balance,
}
```

### ProgressRecorded (Arkiv Integration)

```rust
pub struct ProgressRecorded {
    #[ink(topic)]
    project_owner: AccountId,
    milestone_index: u32,
    progress_notes: Vec<u8>,  // Datos que se registran en Arkiv
}
```

## Compilación

```bash
cd smart-contract/funding-escrow

# Compilar el contrato
cargo +nightly contract build

# Ejecutar tests
cargo test

# Generar metadata
cargo +nightly contract build --release
```

## Deployment en Contracts Pallet

El contrato puede deployarse en:

- **Rococo Contracts** (testnet de Polkadot)
- **Shibuya** (testnet de Astar, compatible con Polkadot)
- **Acala** (parachain de Polkadot con DeFi)

## Estructura de Datos

### FundingEscrow

- `project_owner`: Cuenta que recibe los fondos
- `admin`: Cuenta que puede liberar fondos o cancelar
- `total_amount`: Dinero total del escrow
- `released_amount`: Dinero ya liberado
- `remaining_amount`: Dinero disponible
- `milestones`: Vec de hitos
- `project_metadata`: Datos del proyecto (vinculado con Arkiv)
- `is_cancelled`: ¿Fue cancelado?
- `is_completed`: ¿Todos los hitos fueron liberados?

### Milestone

- `release_percentage`: % del total
- `amount`: Monto en unidades pequeñas
- `is_released`: ¿Fue liberado?
- `released_at`: Timestamp
- `description`: Descripción del hito

### ProjectMetadata

- `project_id`: ID en Arkiv
- `project_name`: Nombre
- `description`: Descripción
- `arkiv_entity_url`: Link a la entidad en Arkiv
- `created_at`: Timestamp de creación

## Integración con Arkiv

El smart contract almacena los metadatos del proyecto y emite eventos cuando hay progreso:

1. **Event `ProgressRecorded`** es escuchado por el backend
2. Backend actualiza la entidad en Arkiv con:

   - Estado actual del hito
   - Notas de progreso
   - Timestamp
   - Monto liberado

3. **Arkiv entity** queda así:
   ```json
   {
     "project_id": "123",
     "milestones": [
       {
         "name": "Prototipo",
         "status": "completed",
         "amount_released": 2500,
         "progress_notes": "Completamos prototipo",
         "released_at": 1234567890
       }
     ]
   }
   ```

## Seguridad

- ✅ Solo el admin puede liberar fondos
- ✅ Solo el project_owner puede registrar progreso
- ✅ No se puede liberar un hito dos veces
- ✅ No se puede cancelar si está completado
- ✅ Los fondos se transfieren verificando que la operación sea exitosa
- ✅ Validación de porcentajes (deben sumar 100)

## Próximos Pasos

1. **Test en Rococo Contracts**
2. **Integrar en backend**: POST `/deploy-escrow`
3. **Integrar en frontend**: Mostrar hitos y botón para liberar (solo admin)
4. **Arkiv integration**: Escuchar eventos y actualizar entidad
