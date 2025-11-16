# Funding Escrow Smart Contract - Setup

## Requisitos

- **Rust** (1.70+)
- **Cargo** (bundled con Rust)
- **ink!** toolchain: `cargo +nightly install cargo-contract`

## Instalación de Herramientas

### 1. Instalar Rust (si no lo tienes)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### 2. Agregar toolchain nightly
```bash
rustup toolchain install nightly
rustup target add wasm32-unknown-unknown --toolchain nightly
```

### 3. Instalar cargo-contract
```bash
cargo +nightly install cargo-contract --locked
```

Verificar instalación:
```bash
cargo contract --version
```

## Compilación

```bash
# Desde el directorio funding-escrow/
cargo +nightly contract build

# Para release (optimizado):
cargo +nightly contract build --release
```

Esto genera:
- `target/ink/funding_escrow.wasm` - Contrato compilado
- `target/ink/funding_escrow.json` - Metadata del contrato

## Testing

```bash
cargo +nightly contract test
```

## Archivos Generados

Después de compilar, verás:

```
target/
├── ink/
│   ├── funding_escrow.wasm       # Bytecode del contrato
│   ├── funding_escrow.json       # Metadata (ABI)
│   └── funding_escrow.opt.wasm   # Versión optimizada
├── debug/
└── release/
```

## Deployment en Testnet

### Opción 1: Rococo Contracts (Recomendado para testing)

1. Ir a [Polkadot.js Apps](https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-contracts-rpc.polkadot.io)
2. Seleccionar "Rococo Contracts"
3. Developers → Contracts → Upload Contract
4. Subir el archivo `funding_escrow.wasm`
5. Proporcionar constructor arguments
6. Firmar y deployar

### Opción 2: Shibuya (Astar Testnet)

1. Ir a [Astar Apps](https://shibuya.subscan.io/)
2. Conectar wallet
3. Ir a Contracts section
4. Upload contract
5. Deployar

### Opción 3: Script de Deployment (Python + Subxt)

```python
# Este será proporcionado en la siguiente etapa
# cuando integremos con el backend
```

## Verificación Post-Deployment

Una vez deployado, verifica que el contrato responde:

```bash
# Obtener información del contrato
# (desde Polkadot.js Apps o mediante subxt RPC)
```

## Estructura del Proyecto

```
funding-escrow/
├── src/
│   └── lib.rs              # Código principal del contrato
├── Cargo.toml              # Dependencias
├── examples/
│   └── integration_flow.rs # Ejemplos de uso
├── target/                 # Build artifacts
└── .gitignore
```

## Próximos Pasos

1. **Compilar y testear localmente**
2. **Deployar a Rococo Contracts testnet**
3. **Integrar con backend** (crear endpoint `/deploy-escrow`)
4. **Crear interfaz en frontend** para ver hitos y liberar fondos
5. **Integrar eventos con Arkiv** para registrar progreso

## Troubleshooting

### Error: `nightly toolchain not found`
```bash
rustup toolchain install nightly
```

### Error: `wasm32-unknown-unknown target not found`
```bash
rustup target add wasm32-unknown-unknown --toolchain nightly
```

### Error: `cargo contract not found`
```bash
cargo +nightly install cargo-contract --locked
```

### Error al compilar: `cannot find attribute macro ink`
Asegurate de tener las dependencias correctas en Cargo.toml

## Documentación Adicional

- [ink! Docs](https://docs.rs/ink/latest/ink/)
- [Polkadot Contracts](https://wiki.polkadot.network/docs/build-smart-contracts)
- [Rococo Testnet](https://wiki.polkadot.network/docs/maintain-networks#rococo-testnet)
