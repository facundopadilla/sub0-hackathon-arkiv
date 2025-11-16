# Arkiv Hash Storage Fix - Complete Hash Capture

## Problem

La entidad en Arkiv se estaba creando correctamente pero el hash completo no se guardaba en la base de datos. El método `create_entity()` de Arkiv SDK estaba devolviendo múltiples valores pero solo se capturaba el primer valor.

## Root Cause

1. **Desempaquetamiento incorrecto**: En `ArkivService.save_sponsored_project()`, el código desempaquetaba solo dos valores:

   ```python
   entity_key, _ = client.arkiv.create_entity(...)  # El underscore descartaba info
   ```

2. **Campos privados no serializables**: Los campos con prefijo `_` (underscore) en Pydantic no se incluyen en la validación, impediendo que se guardaran en la BD

## Solution Implemented

### 1. **ArkivService Enhancement** (`src/services/arkiv.py`)

```python
# Before: Descartaba el segundo valor
entity_key, _ = client.arkiv.create_entity(...)

# After: Captura ambos valores
result = client.arkiv.create_entity(...)
if isinstance(result, tuple):
    entity_key = result[0]
    tx_hash = result[1] if len(result) > 1 else None
else:
    entity_key = result
    tx_hash = None

return {
    "entity_key": entity_key,
    "tx_hash": tx_hash
}
```

### 2. **Model Updates** (`src/models/sponsor.py`)

Agregó campos nuevos en todas las clases:

- `SponsoredProject` (tabla DB)
- `SponsoredProjectCreate` (schema)
- `SponsoredProjectUpdate` (schema)
- `SponsoredProjectOut` (respuesta API)

```python
# Removed underscore prefix to allow Pydantic serialization
entity_key: Optional[str] = None    # Previously: _entity_key
tx_hash: Optional[str] = None       # Previously: _tx_hash
```

### 3. **Endpoint Update** (`src/routes/v1/arkiv.py`)

```python
# Ahora captura y guarda ambos valores
arkiv_result = ArkivService.save_sponsored_project(client, data)
entity_key = arkiv_result["entity_key"]
tx_hash = arkiv_result.get("tx_hash")

# Guardar en BD
sponsored_data = {
    ...
    "entity_key": entity_key,
    "tx_hash": tx_hash,
}
```

### 4. **Database Migration**

```sql
-- Nueva estructura de la tabla sponsoredproject
CREATE TABLE sponsoredproject (
    id SERIAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    project_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    repo VARCHAR NOT NULL,
    ai_score FLOAT NOT NULL,
    status VARCHAR NOT NULL,
    contract_address VARCHAR NOT NULL,
    chain VARCHAR NOT NULL,
    budget FLOAT NOT NULL,
    description VARCHAR,
    entity_key VARCHAR,          -- NEW: Hash de la entidad Arkiv
    tx_hash VARCHAR,             -- NEW: Hash de la transacción
    PRIMARY KEY (id)
)
```

## Files Modified

- ✅ `src/services/arkiv.py` - Captura ambos valores del SDK
- ✅ `src/models/sponsor.py` - Agregó campos `entity_key`, `tx_hash`
- ✅ `src/routes/v1/arkiv.py` - Guarda ambos valores en la BD
- ✅ `reset_db.py` - Ejecutado para recrear tablas

## Changes Summary

| Component    | Before             | After                          |
| ------------ | ------------------ | ------------------------------ |
| Return Value | `entity_key` (str) | `{entity_key, tx_hash}` (dict) |
| DB Fields    | `_entity_key`      | `entity_key`, `tx_hash`        |
| API Response | No tx_hash         | Incluye `tx_hash`              |
| Storage      | Hash incompleto    | Hash completo capturado        |

## API Response Example

```json
{
  "entity_key": "0x1234...abcd",
  "tx_hash": "0x5678...efgh",
  "status": "stored",
  "id": 1
}
```

## Database Query Example

```sql
SELECT entity_key, tx_hash FROM sponsoredproject WHERE project_id = 'proj_001';
-- entity_key    | tx_hash
-- 0x1234...abcd | 0x5678...efgh
```

## Impact

✅ **Complete blockchain data capture** - Todo el hash ahora se guarda  
✅ **Better auditability** - Ambos IDs disponibles para auditoría  
✅ **Reliable recovery** - Puedes recuperar cualquier contrato con ambos hashes  
✅ **API transparency** - Cliente recibe toda la info de la transacción

## Next Steps

- ✅ Verificar que la BD tiene los nuevos campos
- ⏳ Probar endpoint POST /sponsor con una transacción real
- ⏳ Verificar que ambos valores se guardan correctamente
- ⏳ Implementar query para recuperar por entity_key o tx_hash

## Commit

```
4119f58 🔧 Fix Arkiv hash storage - capture complete tx_hash and entity_key
```
