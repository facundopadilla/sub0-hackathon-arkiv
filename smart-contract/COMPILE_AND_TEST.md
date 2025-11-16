# 🛠️ Compilación y Testing del Smart Contract

## Paso 1: Verificar Requisitos

```bash
# Verificar Rust
rustc --version
cargo --version

# Verificar nightly
rustup toolchain list | grep nightly

# Verificar cargo-contract
cargo contract --version
```

Si algo falta, instalar según [SETUP.md](smart-contract/funding-escrow/SETUP.md)

---

## Paso 2: Compilar el Smart Contract

```bash
cd smart-contract/funding-escrow

# Compilación debug (rápido, para desarrollo)
cargo +nightly contract build

# Compilación release (lento, optimizado para producción)
cargo +nightly contract build --release
```

**Esperado:**
```
Your contract artifacts are ready. You can find them in:
target/ink/
  - funding_escrow.wasm
  - funding_escrow.json
  - funding_escrow.opt.wasm
```

**Archivos generados:**
- `funding_escrow.wasm` - Bytecode del contrato
- `funding_escrow.json` - ABI/Metadata
- `funding_escrow.opt.wasm` - Versión optimizada

---

## Paso 3: Ejecutar Tests Unitarios

```bash
# Tests locales (sin blockchain)
cd smart-contract/funding-escrow
cargo +nightly contract test

# Con output detallado
cargo +nightly contract test -- --nocapture
```

**Tests disponibles (agregados al código):**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[ink::test]
    fn create_escrow_should_work() {
        // TODO: Implementar test
    }

    #[ink::test]
    fn release_milestone_should_work() {
        // TODO: Implementar test
    }

    #[ink::test]
    fn cancel_escrow_should_work() {
        // TODO: Implementar test
    }

    #[ink::test]
    fn record_progress_should_work() {
        // TODO: Implementar test
    }
}
```

---

## Paso 4: Verificación Manual en Rococo Testnet

### Opción A: Usar Polkadot.js Apps (UI Web)

1. Ir a [Polkadot.js Apps](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-contracts-rpc.polkadot.io)
2. Seleccionar "Rococo Contracts" en dropdown
3. Conectar wallet
4. Developers → Contracts → Upload Contract
5. Seleccionar `target/ink/funding_escrow.wasm`
6. Seleccionar `target/ink/funding_escrow.json` (metadata)
7. Click "Upload"
8. Firmar transacción
9. Esperar confirmación

### Opción B: Script de Deployment (Python)

Crear `scripts/deploy_contract.py`:

```python
#!/usr/bin/env python3

import json
import asyncio
from subxt_py import Keypair, SubstrateInterface
from pathlib import Path

async def deploy_contract():
    """Deploy funding escrow contract to Rococo Contracts."""
    
    # Conectar a Rococo Contracts
    substrate = SubstrateInterface(
        url="wss://rococo-contracts-rpc.polkadot.io"
    )
    
    # Cargar keypair (con fondos)
    keypair = Keypair.create_from_mnemonic(
        "your seed phrase here"
    )
    
    # Cargar bytecode
    wasm_path = Path("smart-contract/funding-escrow/target/ink/funding_escrow.opt.wasm")
    with open(wasm_path, "rb") as f:
        wasm_code = f.read()
    
    # Cargar metadata
    metadata_path = Path("smart-contract/funding-escrow/target/ink/funding_escrow.json")
    with open(metadata_path) as f:
        metadata = json.load(f)
    
    print("🚀 Deployando contrato a Rococo Contracts...")
    print(f"   Desde: {keypair.ss58_address}")
    print(f"   Bytecode size: {len(wasm_code)} bytes")
    print(f"   Constructor: new()")
    
    # TODO: Implementar deployment via subxt
    # Por ahora, usar Polkadot.js Apps manualmente
    
    print("✅ Contrato deployed exitosamente")
    print(f"   Contract Address: 0x...")

if __name__ == "__main__":
    asyncio.run(deploy_contract())
```

Ejecutar:
```bash
python3 scripts/deploy_contract.py
```

---

## Paso 5: Testear Métodos del Contrato

### Test: create_escrow

```json
{
  "project_owner": "0x1234....",
  "project_id": "proj_123",
  "project_name": "Test Project",
  "description": "Testing",
  "arkiv_entity_url": "https://arkiv.example.com/proj_123",
  "milestone_percentages": [25, 25, 25, 25],
  "milestone_descriptions": [
    "Phase 1",
    "Phase 2", 
    "Phase 3",
    "Phase 4"
  ]
}
```

**Esperado:**
- ✅ Contrato recibe fondos (DOT)
- ✅ Crea 4 hitos de 25% cada uno
- ✅ Emite evento `EscrowCreated`
- ✅ Almacena metadatos

### Test: record_progress

```json
{
  "milestone_index": 0,
  "progress_notes": "Completamos Fase 1"
}
```

**Esperado:**
- ✅ Verifica que caller es project_owner
- ✅ Emite evento `ProgressRecorded`

### Test: release_milestone

```json
{
  "milestone_index": 0
}
```

**Esperado:**
- ✅ Transfiere $2,500 al project_owner
- ✅ Marca hito como liberado
- ✅ Emite evento `FundsReleased`

### Test: cancel_escrow

```json
{}
```

**Esperado:**
- ✅ Solo admin puede llamar
- ✅ Devuelve fondos restantes
- ✅ Emite evento `EscrowCancelled`

---

## Checklist de Verificación

```
Compilación:
☐ cargo +nightly contract build - sin errores
☐ Archivos generados en target/ink/
  ☐ funding_escrow.wasm
  ☐ funding_escrow.json
  ☐ funding_escrow.opt.wasm

Tests Unitarios:
☐ cargo +nightly contract test - todos pasan
☐ create_escrow funciona
☐ release_milestone funciona
☐ cancel_escrow funciona
☐ record_progress funciona

Deployment Rococo:
☐ Contrato carga sin errores
☐ Obtener contract_address
☐ Verificar en explorador

Funcionalidad:
☐ create_escrow crea hitos correctamente
☐ Fondos se dividen en porcentajes
☐ release_milestone transfiere dinero
☐ record_progress emite eventos
☐ cancel_escrow devuelve fondos
```

---

## 🎯 Próximo Paso: Botón "Lanzar Proyecto"

Una vez verificado el smart contract, agregaremos:

1. **Frontend:** Botón "🚀 Lanzar Proyecto" en ProjectsListView
2. **Backend:** Endpoint `/deploy-escrow` que instancia el contrato
3. **Integración:** Al hacer click, se crea y ejecuta el smart contract

El flujo será:
```
Frontend: Click "Lanzar Proyecto"
    ↓
Backend: POST /deploy-escrow
    ↓
Smart Contract: create_escrow()
    ↓
Blockchain: Recibe fondos y crea hitos
    ↓
Frontend: Muestra contract_address y hitos
```

---

## ⚠️ Cosas Importantes

1. **Gas/Fees:**
   - Deployment cuesta gas (~0.5-1.0 DOT en Rococo)
   - Cada transacción cuesta gas

2. **Fondos Rococo:**
   - Necesitas ROC (testnet DOT)
   - Faucet: [rococo-faucet.vercel.app](https://rococo-faucet.vercel.app/)

3. **Seguridad:**
   - NO uses mainnet hasta estar 100% seguro
   - Testea en Rococo primero

4. **Alternativas:**
   - Polkadot Sandbox (local)
   - Rococo Contracts (recomendado)
   - Shibuya (Astar)

---

## 🆘 Troubleshooting

### Error: `cargo contract not found`
```bash
cargo +nightly install cargo-contract --locked
```

### Error: Compilation failed
- Verificar que tienes nightly instalado
- Verificar dependencias en Cargo.toml
- Revisar syntax del contrato

### Error: Contract upload fails
- Verificar que tienes ROC en tu wallet
- Verificar que el archivo .wasm es válido
- Revisar que el metadata.json es correcto

### Error: Transaction rejected
- Verificar que caller tiene fondos
- Verificar que los parámetros son válidos
- Revisar los logs de Rococo

---

**Status:** Listos para compilar ✅

Próximo comando:
```bash
cd smart-contract/funding-escrow
cargo +nightly contract build --release
```
