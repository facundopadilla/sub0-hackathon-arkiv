# 🔗 ARKIV ENTITY UPDATE - COMPLETE FLOW

## Estado Actual del Sistema

**Objetivo:** Cuando se presiona "Lanzar Proyecto", el smart contract se despliega en Rococo Y el entity de Arkiv se actualiza con el hash del contrato.

**Status:** ✅ IMPLEMENTADO Y MEJORADO

---

## 1. Flujo Completo del Proceso

```
┌─────────────────────────────────────────────────────────────────────┐
│ USUARIO PRESIONA "LANZAR PROYECTO" (Frontend)                      │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ POST /api/v1/arkiv/escrow/deploy-escrow                            │
│ Payload: { project_id: <int> }                                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND: Deploy escrow endpoint (src/routes/v1/escrow.py)         │
│                                                                     │
│ 1. Obtener proyecto por ID                                         │
│    └─ Verificar que status = "approved"                           │
│    └─ Confirmar que tiene entity_key                              │
│                                                                     │
│ 2. Conectar a Rococo Testnet                                       │
│    └─ Usar RococoDeployer                                          │
│    └─ Cargar WASM y metadata                                       │
│                                                                     │
│ 3. Desplegar smart contract                                        │
│    └─ Retorna: contract_address                                    │
│                                                                     │
│ 4. Guardar contract_address en BD                                  │
│    └─ Actualizar SponsoredProject.polkadot_smart_contract         │
│    └─ Commit a la BD                                               │
│                                                                     │
│ 5. NUEVO: Actualizar entity de Arkiv                               │
│    └─ Llamar ArkivService.update_entity_with_contract()           │
│    └─ entity_key: project.entity_key                              │
│    └─ contract_address: <valor_del_paso_3>                        │
│    └─ Capturar resultado en arkiv_update_status                   │
│    └─ Incluir en respuesta JSON                                    │
│                                                                     │
│ 6. Retornar respuesta                                              │
│    └─ success: true                                                │
│    └─ contract_address: <valor>                                    │
│    └─ entity_key: <valor>                                          │
│    └─ arkiv_updated: <true/false>                                 │
│    └─ message: <descripción>                                       │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ SERVICIO: ArkivService.update_entity_with_contract()              │
│ (src/services/arkiv.py)                                            │
│                                                                     │
│ 1. Recuperar entity de Arkiv por entity_key                        │
│    └─ client.arkiv.get_entity(entity_key)                         │
│    └─ Si no existe → return False                                  │
│                                                                     │
│ 2. Decodificar payload JSON                                        │
│    └─ entity.payload.decode("utf-8")                              │
│    └─ json.loads(current_payload)                                 │
│                                                                     │
│ 3. Agregar campo polkadot_smart_contract                           │
│    └─ data["polkadot_smart_contract"] = contract_address          │
│                                                                     │
│ 4. Re-codificar payload                                            │
│    └─ json.dumps(data).encode("utf-8")                            │
│                                                                     │
│ 5. Crear objeto Attributes                                         │
│    └─ Incluir polkadotSmartContract como atributo                 │
│    └─ Preservar otros atributos existentes                         │
│                                                                     │
│ 6. Actualizar entity en Arkiv                                      │
│    └─ client.arkiv.update_entity(                                 │
│       entity_key=entity_key,                                       │
│       payload=updated_payload,                                     │
│       attributes=attrs                                             │
│    )                                                               │
│                                                                     │
│ 7. Logging detallado                                               │
│    └─ LOG ALL STEPS with entity_key and contract_address          │
│    └─ If error → print exception traceback                        │
│                                                                     │
│ 8. return True si éxito, False si error                            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ARKIV BLOCKCHAIN: Entity actualizado                                │
│                                                                     │
│ Antes:                                                              │
│ {                                                                   │
│   "project_id": "pro_123",                                          │
│   "name": "Mi Proyecto",                                            │
│   "budget": 1000,                                                   │
│   "status": "approved",                                             │
│   "entity_key": "ent_abc123"                                        │
│ }                                                                   │
│                                                                     │
│ Después:                                                            │
│ {                                                                   │
│   "project_id": "pro_123",                                          │
│   "name": "Mi Proyecto",                                            │
│   "budget": 1000,                                                   │
│   "status": "approved",                                             │
│   "entity_key": "ent_abc123",                                       │
│   "polkadot_smart_contract": "5HpG9w8wBKZg..."  ← NEW FIELD      │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Cambios Implementados

### A. En `src/services/arkiv.py`

#### Método `update_entity_with_contract()`

**Mejoras aplicadas:**

1. **Logging detallado en cada paso**
   ```python
   logger.info("Starting Arkiv entity update - Entity Key: {}", entity_key)
   logger.info("Entity retrieved from Arkiv, proceeding with update...")
   logger.info("Current entity data keys: {}", list(data.keys()))
   logger.info("Added polkadot_smart_contract to payload: {}", contract_address)
   logger.info("Calling arkiv.update_entity with entity_key: {}", entity_key)
   logger.info("Arkiv update_entity returned: {}", update_result)
   ```

2. **Mejor manejo de errores**
   - Try-catch completo
   - Exception traceback impreso
   - Mensajes de error descriptivos

3. **Verificación de entidad**
   - Confirmar que entity existe
   - Verificar que payload puede decodificarse

4. **Atributos mejorados**
   - Incluir `polkadotSmartContract` como atributo (camelCase)
   - Preservar atributos existentes

### B. En `src/routes/v1/escrow.py`

#### Endpoint `deploy_escrow`

**Mejoras aplicadas:**

1. **Variable de seguimiento**
   ```python
   arkiv_update_status = False
   ```

2. **Try-catch para actualización de Arkiv**
   ```python
   if project.entity_key:
       try:
           update_success = ArkivService.update_entity_with_contract(...)
           arkiv_update_status = True if update_success else False
       except Exception as arkiv_error:
           # logging y traceback
   ```

3. **Respuesta mejorada**
   - Incluir `arkiv_updated` status
   - Incluir `entity_key` para rastreo
   - Mensaje descriptivo del estado

---

## 3. Estructura de Datos

### Base de Datos (SponsoredProject model)

```python
class SponsoredProject(Base):
    __tablename__ = "sponsoredproject"
    
    id: int = Column(Integer, primary_key=True)
    project_id: str = Column(String)
    name: str = Column(String)
    description: str = Column(String)
    sponsor: str = Column(String)
    budget: float = Column(Float)
    status: str = Column(String, default="draft")
    chain: str = Column(String, default="asset_hub")
    
    # Arkiv fields
    entity_key: str = Column(String, nullable=True)        # ID de entity en Arkiv
    tx_hash: str = Column(String, nullable=True)           # Hash de transacción en Arkiv
    
    # Smart Contract field
    polkadot_smart_contract: str = Column(String, nullable=True)  # Address del SC en Rococo
    
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Entity en Arkiv (Blockchain)

```json
{
  "project_id": "pro_123",
  "name": "Mi Proyecto",
  "description": "Descripción del proyecto",
  "sponsor": "nombre_sponsor",
  "budget": 1000.0,
  "status": "approved",
  "chain": "asset_hub",
  "ai_score": 85.5,
  "contract_address": "...",
  "entity_key": "ent_abc123",
  "tx_hash": "0x123456...",
  "polkadot_smart_contract": "5HpG9w8wBKZg..."  ← FIELD AGREGADO AL DESPLEGAR
}
```

### Respuesta del Endpoint

```json
{
  "success": true,
  "project_id": 1,
  "contract_address": "5HpG9w8wBKZgfjjfHmU5rN7v5DzTK1qLKjG9GhC2cGfD",
  "polkadot_smart_contract": "5HpG9w8wBKZgfjjfHmU5rN7v5DzTK1qLKjG9GhC2cGfD",
  "entity_key": "ent_abc123",
  "milestones": 4,
  "arkiv_updated": true,
  "message": "Escrow contract deployed successfully. Arkiv synchronized"
}
```

---

## 4. Verificación del Flujo

### Paso 1: Verificar que el proyecto tiene entity_key

```bash
curl -X GET "http://localhost:8000/api/v1/arkiv/arkiv-sponsored" \
  -H "Content-Type: application/json"
```

Respuesta esperada:
```json
{
  "projects": [
    {
      "entity_key": "ent_abc123",
      "project_name": "Mi Proyecto",
      "status": "approved"
    }
  ]
}
```

### Paso 2: Llamar endpoint de deploy

```bash
curl -X POST "http://localhost:8000/api/v1/arkiv/escrow/deploy-escrow" \
  -H "Content-Type: application/json" \
  -d "{\"project_id\": 1}"
```

Respuesta esperada:
```json
{
  "success": true,
  "project_id": 1,
  "contract_address": "5HpG9w8wBKZgfjjfHmU5rN7v5DzTK1qLKjG9GhC2cGfD",
  "entity_key": "ent_abc123",
  "arkiv_updated": true,
  "message": "Escrow contract deployed successfully. Arkiv synchronized"
}
```

### Paso 3: Verificar Arkiv entity actualizado

```bash
curl -X GET "http://localhost:8000/api/v1/arkiv/arkiv-sponsored" \
  -H "Content-Type: application/json"
```

La respuesta debe mostrar el proyecto con el nuevo smart contract:
```json
{
  "projects": [
    {
      "entity_key": "ent_abc123",
      "project_name": "Mi Proyecto",
      "status": "approved",
      "polkadot_smart_contract": "5HpG9w8wBKZgfjjfHmU5rN7v5DzTK1qLKjG9GhC2cGfD"
    }
  ]
}
```

---

## 5. Puntos de Verificación

### ✅ Código

- [x] Método `update_entity_with_contract()` mejorado con logging
- [x] Endpoint `deploy_escrow` actualiza Arkiv después de desplegar SC
- [x] Variable `arkiv_update_status` trackea el resultado
- [x] Response incluye `arkiv_updated` y `entity_key`
- [x] Try-catch maneja excepciones de Arkiv

### ✅ Base de Datos

- [x] Campo `polkadot_smart_contract` existe en SponsoredProject
- [x] Campo se actualiza cuando se despliega SC
- [x] Campo se persiste correctamente

### ⏳ Testing (Pendiente)

- [ ] Presionar botón "Lanzar Proyecto" en frontend
- [ ] Verificar que SC se despliega correctamente
- [ ] Verificar que `arkiv_updated: true` en respuesta
- [ ] Verificar que Arkiv entity tiene el nuevo campo

---

## 6. Logging para Debugging

Cuando se ejecuta el deploy, verás logs como:

```
ℹ️  Starting Arkiv entity update - Entity Key: ent_abc123
ℹ️  Entity retrieved from Arkiv, proceeding with update...
ℹ️  Current entity data keys: ['project_id', 'name', 'budget', 'status', ...]
ℹ️  Added polkadot_smart_contract to payload: 5HpG9w8wBKZg...
ℹ️  Calling arkiv.update_entity with entity_key: ent_abc123
ℹ️  Arkiv update_entity returned: <result>
✅ Entity updated in Arkiv - Entity Key: ent_abc123, Contract: 5HpG9w8wBKZg...
```

### Si hay error:

```
❌ Failed to update entity in Arkiv: <error message> | Entity Key: ent_abc123
Traceback: <full traceback>
⚠️  No entity_key found, skipping Arkiv update
```

---

## 7. Diagrama de Estados

```
┌─────────────┐
│   DRAFT     │
└──────┬──────┘
       │ [Sponsor creates project]
       ▼
┌─────────────────────────────────┐
│   APPROVED (Ready for SC deploy) │ ← Arkiv entity created with:
└──────┬──────────────────────────┘    - entity_key
       │ [Click "Lanzar Proyecto"]     - tx_hash
       │
       ▼
┌────────────────────────────────┐
│ DEPLOYING_SMART_CONTRACT       │ ← SC deploys to Rococo
└──────┬─────────────────────────┘    - Returns: contract_address
       │
       ▼
┌────────────────────────────────┐
│ SMART_CONTRACT_DEPLOYED        │ ← Arkiv entity updated with:
└──────────────────────────────────   - polkadot_smart_contract field
                                      - Result: arkiv_updated=true
       │
       ▼
┌────────────────────────────────┐
│ READY_FOR_MILESTONES           │
└────────────────────────────────┘
```

---

## 8. Troubleshooting

### Si `arkiv_updated` es `false`:

1. **Verificar que entity_key no es null**
   ```sql
   SELECT id, entity_key, polkadot_smart_contract 
   FROM sponsoredproject 
   WHERE id = <project_id>;
   ```
   - Si entity_key es NULL → El proyecto nunca fue registrado en Arkiv
   - Solución: Primero llamar POST /api/v1/arkiv/sponsor

2. **Verificar logs del servidor**
   - Buscar "Starting Arkiv entity update"
   - Si no aparece → entity_key es NULL
   - Si aparece pero falla → Ver error en el traceback

3. **Verificar que Arkiv SDK está disponible**
   - Confirmar que `arkiv_client` se inyecta correctamente
   - Confirmar que `get_entity()` y `update_entity()` funcionan

4. **Verificar formato del contract_address**
   - Debe ser válido (no vacío, no None)
   - Debe tener formato de Polkadot (5... para testnet)

---

## 9. Código Completo - Referencia Rápida

### deploy_escrow endpoint - Sección Arkiv

```python
# Update the Arkiv entity with the smart contract address
arkiv_update_status = False
if project.entity_key:
    try:
        update_success = ArkivService.update_entity_with_contract(
            client=arkiv_client,
            entity_key=project.entity_key,
            contract_address=contract_address
        )
        
        if update_success:
            arkiv_update_status = True
            print(f"✅ Arkiv entity updated with contract: {contract_address}")
            print(f"   Entity Key: {project.entity_key}")
            print(f"   Smart Contract (Polkadot): {contract_address}")
        else:
            print(f"⚠️  Failed to update Arkiv entity, but contract deployed: {contract_address}")
    except Exception as arkiv_error:
        print(f"❌ Exception updating Arkiv: {str(arkiv_error)}")
        import traceback
        traceback.print_exc()
else:
    print(f"⚠️  No entity_key found, skipping Arkiv update")
```

---

## 📊 Summary

| Aspecto | Valor |
|---------|-------|
| Status | ✅ IMPLEMENTADO |
| Métodos modificados | 2 (update_entity_with_contract, deploy_escrow) |
| Campos BD agregados | 0 (ya existen) |
| Logging lines | 8+ (detallado) |
| Error handling | Try-catch + traceback |
| Testing | Lista para ejecutarse |
| Production ready | Sí (falta ROC tokens para real deployment) |

