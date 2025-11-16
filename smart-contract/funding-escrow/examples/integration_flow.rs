// Ejemplos de interacción con el smart contract Funding Escrow
// Estos ejemplos muestran cómo llamar los métodos desde el backend

use std::str::FromStr;
use subxt::tx::Signer;
use subxt::{OnlineClient, PolkadotConfig};
use subxt_signer::sr25519::dev;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Conectar a un nodo Rococo Contracts
    let api = OnlineClient::<PolkadotConfig>::from_url("wss://rococo-contracts-rpc.polkadot.io")
        .await?;

    let from = dev::alice();

    // ===== EJEMPLO 1: Crear Escrow =====
    // Cuando un proyecto es aprobado, creamos el escrow
    
    let project_owner = dev::bob().public_key().0;
    let project_id = b"project_123".to_vec();
    let project_name = b"My Awesome Project".to_vec();
    let description = b"Building a revolutionary app".to_vec();
    let arkiv_entity_url = b"https://arkiv.example.com/entities/project_123".to_vec();
    
    let milestone_percentages = vec![25, 25, 25, 25]; // 100%
    let milestone_descriptions = vec![
        b"Phase 1: Prototipo".to_vec(),
        b"Phase 2: Beta testing".to_vec(),
        b"Phase 3: Producción".to_vec(),
        b"Phase 4: Soporte y mantenimiento".to_vec(),
    ];

    // Fondos: 10 DOT (en unidades pequeñas: 10 * 10^12)
    let total_funds = 10_000_000_000_000u128;

    println!("1. Creando escrow con {} DOT", total_funds / 1_000_000_000_000);
    // Aquí iría la llamada al contrato via subxt
    // let create_tx = /* build create_escrow transaction */;
    // api.tx().sign_and_submit_default(&create_tx, &from).await?;

    // ===== EJEMPLO 2: Registrar Progreso =====
    // El project_owner registra que completó el hito 0
    
    println!("\n2. Project Owner registra progreso en hito 0");
    let progress_notes = b"Completamos el prototipo - disponible en: https://github.com/project/releases/v1.0".to_vec();
    // let progress_tx = /* build record_progress transaction */;
    // api.tx().sign_and_submit_default(&progress_tx, &from).await?;

    // ===== EJEMPLO 3: Liberar Fondos del Hito =====
    // El admin (moderador) verifica el progreso y libera los fondos
    
    println!("\n3. Admin (moderador) libera fondos del hito 0");
    println!("   Transferencia: 2.5 DOT al project_owner");
    // let release_tx = /* build release_milestone transaction */;
    // api.tx().sign_and_submit_default(&release_tx, &from).await?;

    // ===== EJEMPLO 4: Obtener Estado del Escrow =====
    
    println!("\n4. Consultando estado del escrow");
    // let escrow_info = /* llamar get_escrow */;
    // println!("Total: {} DOT", escrow_info.total_amount / 1_000_000_000_000);
    // println!("Liberado: {} DOT", escrow_info.released_amount / 1_000_000_000_000);
    // println!("Restante: {} DOT", escrow_info.remaining_amount / 1_000_000_000_000);

    // ===== EJEMPLO 5: Cancelar Escrow =====
    // Si el proyecto no avanza, el admin puede cancelar y recuperar los fondos restantes
    
    println!("\n5. Admin cancela el escrow (sin progreso)");
    println!("   Recupera fondos restantes");
    // let cancel_tx = /* build cancel_escrow transaction */;
    // api.tx().sign_and_submit_default(&cancel_tx, &from).await?;

    Ok(())
}

/*

FLUJO COMPLETO DESDE FRONTEND:

1. [Frontend] Moderador aprueba proyecto en Moderación tab
   ↓
2. [Frontend] Hace POST a /deploy-escrow con:
   {
     "project_id": 123,
     "project_name": "Mi Proyecto",
     "total_budget": 10000,
     "milestones": [
       {
         "percentage": 25,
         "description": "Fase 1: Prototipo"
       },
       ...
     ]
   }
   ↓
3. [Backend] Valida datos del proyecto
   ↓
4. [Backend] Llama al smart contract create_escrow(...)
   - Envia 10,000 DOT al contrato
   - El contrato crea 4 hitos de 2,500 DOT cada uno
   - Almacena metadatos del proyecto
   ↓
5. [Smart Contract] Emite evento EscrowCreated
   ↓
6. [Backend] Captura el evento
   - Extrae contract_address del evento
   - Guarda en sponsoredproject.contract_address
   - Retorna al frontend
   ↓
7. [Frontend] Recibe respuesta con contract_address
   - Muestra "Escrow creado con éxito"
   - El proyecto ahora aparece en "Arkiv Projects"
   ↓
8. [Project Owner] Ve el proyecto en Arkiv Projects
   - Ve los 4 hitos
   - Ve $2,500 asignados a cada uno
   - Comienza a trabajar
   ↓
9. [Project Owner] Completa Hito 1 y registra progreso
   - Llama: record_progress(0, "Completamos prototipo en...")
   - Smart contract emite: ProgressRecorded
   ↓
10. [Backend] Escucha evento ProgressRecorded
    - Actualiza la entidad en Arkiv con el progreso
    - Envía notificación al admin
   ↓
11. [Admin] Ve el progreso en Arkiv
    - Verifica que el trabajo está hecho
    - Ejecuta: release_milestone(0)
    ↓
12. [Smart Contract] Libera $2,500
    - Transfiere al project_owner
    - Emite: FundsReleased
    ↓
13. [Backend] Escucha FundsReleased
    - Actualiza Arkiv: estado_hito_1 = "liberated"
    - Actualiza BD: released_amount = 2500
    ↓
14. Ciclo se repite para hitos 2, 3, 4
    ↓
15. [Smart Contract] Cuando se libera el hito 4
    - Marca escrow como is_completed = true
    - Proyecto finalizado

ESCENARIO ALTERNATIVO: Si no hay progreso

1-7. [Mismo hasta que se crea escrow]
   ↓
8. [Project Owner] No hace nada (sin progreso)
   ↓
9. [Admin] Espera X días/semanas
   ↓
10. [Admin] Decide cancelar por falta de progreso
    - Ejecuta: cancel_escrow()
    ↓
11. [Smart Contract]
    - Libera los fondos restantes ($10,000) al admin
    - Marca is_cancelled = true
    - Emite: EscrowCancelled
    ↓
12. [Backend] Escucha EscrowCancelled
    - Actualiza BD: escrow_status = "cancelled"
    - Actualiza Arkiv: proyecto status = "cancelled"
    - Envía notificación al project_owner

*/
