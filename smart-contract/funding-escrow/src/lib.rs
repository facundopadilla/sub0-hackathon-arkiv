#![cfg_attr(not(feature = "std"), no_std, no_main)]

pub mod funding_escrow {
    use ink::prelude::*;
    use scale::{Decode, Encode};

    /// Estructura para registrar la liberación de fondos
    #[derive(Encode, Decode, Clone, Copy)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Milestone {
        /// Porcentaje del total a liberar (0-100)
        pub release_percentage: u32,
        /// Monto a liberar en esta etapa (en unidades pequeñas)
        pub amount: Balance,
        /// ¿Fue completada esta etapa?
        pub is_released: bool,
        /// Timestamp de cuando se liberó (0 si no se liberó)
        pub released_at: u64,
        /// Descripción de la etapa
        pub description: Vec<u8>,
    }

    /// Estructura para almacenar datos del proyecto desde Arkiv
    #[derive(Encode, Decode, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct ProjectMetadata {
        /// ID del proyecto en Arkiv
        pub project_id: Vec<u8>,
        /// Nombre del proyecto
        pub project_name: Vec<u8>,
        /// Descripción del proyecto
        pub description: Vec<u8>,
        /// URL de la entidad en Arkiv
        pub arkiv_entity_url: Vec<u8>,
        /// Timestamp de creación
        pub created_at: u64,
    }

    /// Estructura principal del Escrow de Fondos
    #[derive(Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct FundingEscrow {
        /// Propietario del escrow (quien recibe los fondos - el proyecto)
        pub project_owner: AccountId,
        /// Administrador del escrow (quien puede cancelar si no hay progreso)
        pub admin: AccountId,
        /// Monto total del escrow
        pub total_amount: Balance,
        /// Monto ya liberado
        pub released_amount: Balance,
        /// Monto restante
        pub remaining_amount: Balance,
        /// Hitos/etapas de liberación
        pub milestones: Vec<Milestone>,
        /// Metadatos del proyecto desde Arkiv
        pub project_metadata: ProjectMetadata,
        /// ¿Está cancelado?
        pub is_cancelled: bool,
        /// ¿Está finalizado?
        pub is_completed: bool,
    }

    /// Smart Contract de Funding Escrow
    #[ink::contract]
    pub mod funding_escrow_contract {
        use super::*;

        /// Evento: Escrow creado
        #[ink(event)]
        pub struct EscrowCreated {
            #[ink(topic)]
            project_owner: AccountId,
            total_amount: Balance,
            milestone_count: u32,
        }

        /// Evento: Fondo liberado
        #[ink(event)]
        pub struct FundsReleased {
            #[ink(topic)]
            project_owner: AccountId,
            milestone_index: u32,
            amount: Balance,
        }

        /// Evento: Escrow cancelado
        #[ink(event)]
        pub struct EscrowCancelled {
            #[ink(topic)]
            project_owner: AccountId,
            remaining_amount: Balance,
        }

        /// Evento: Progreso registrado desde Arkiv
        #[ink(event)]
        pub struct ProgressRecorded {
            #[ink(topic)]
            project_owner: AccountId,
            milestone_index: u32,
            progress_notes: Vec<u8>,
        }

        /// Almacenamiento del contrato
        #[ink(storage)]
        pub struct FundingEscrowContract {
            /// Mapeo de project_owner -> FundingEscrow
            escrows: ink::storage::Mapping<AccountId, FundingEscrow>,
            /// Lista de propietarios de proyectos activos
            active_projects: Vec<AccountId>,
        }

        impl FundingEscrowContract {
            /// Constructor
            #[ink(constructor)]
            pub fn new() -> Self {
                Self {
                    escrows: ink::storage::Mapping::new(),
                    active_projects: Vec::new(),
                }
            }

            /// Crear un nuevo escrow con hitos
            /// 
            /// # Argumentos
            /// * `project_owner` - Cuenta que recibirá los fondos
            /// * `project_id` - ID del proyecto en Arkiv
            /// * `project_name` - Nombre del proyecto
            /// * `total_amount` - Monto total del escrow
            /// * `milestone_percentages` - Vec de porcentajes para cada hito (deben sumar 100)
            /// * `descriptions` - Descripciones de cada hito
            #[ink(message, payable)]
            pub fn create_escrow(
                &mut self,
                project_owner: AccountId,
                project_id: Vec<u8>,
                project_name: Vec<u8>,
                description: Vec<u8>,
                arkiv_entity_url: Vec<u8>,
                milestone_percentages: Vec<u32>,
                milestone_descriptions: Vec<Vec<u8>>,
            ) -> Result<(), EscrowError> {
                // Validar que se envió el dinero
                let deposited = self.env().transferred_value();
                if deposited == 0 {
                    return Err(EscrowError::InsufficientFunds);
                }

                // Validar que no existe escrow previo
                if self.escrows.contains(project_owner) {
                    return Err(EscrowError::EscrowAlreadyExists);
                }

                // Validar que los porcentajes suman 100
                let total_percentage: u32 = milestone_percentages.iter().sum();
                if total_percentage != 100 {
                    return Err(EscrowError::InvalidMilestonePercentages);
                }

                // Validar cantidad de hitos
                if milestone_percentages.len() != milestone_descriptions.len() {
                    return Err(EscrowError::MilestoneCountMismatch);
                }

                // Crear los hitos
                let mut milestones = Vec::new();
                for (index, percentage) in milestone_percentages.iter().enumerate() {
                    let amount = (deposited / 100) * (*percentage as u128);
                    milestones.push(Milestone {
                        release_percentage: *percentage,
                        amount,
                        is_released: false,
                        released_at: 0,
                        description: milestone_descriptions[index].clone(),
                    });
                }

                // Crear metadatos del proyecto
                let project_metadata = ProjectMetadata {
                    project_id,
                    project_name,
                    description,
                    arkiv_entity_url,
                    created_at: self.env().block_timestamp(),
                };

                // Crear el escrow
                let escrow = FundingEscrow {
                    project_owner,
                    admin: self.env().caller(),
                    total_amount: deposited,
                    released_amount: 0,
                    remaining_amount: deposited,
                    milestones,
                    project_metadata,
                    is_cancelled: false,
                    is_completed: false,
                };

                // Guardar
                self.escrows.insert(project_owner, &escrow);
                self.active_projects.push(project_owner);

                // Emitir evento
                self.env().emit_event(EscrowCreated {
                    project_owner,
                    total_amount: deposited,
                    milestone_count: escrow.milestones.len() as u32,
                });

                Ok(())
            }

            /// Liberar fondos de un hito completado
            #[ink(message)]
            pub fn release_milestone(&mut self, milestone_index: u32) -> Result<(), EscrowError> {
                let caller = self.env().caller();
                let mut escrow = self
                    .escrows
                    .get(&caller)
                    .ok_or(EscrowError::EscrowNotFound)?;

                // Validar que no está cancelado
                if escrow.is_cancelled {
                    return Err(EscrowError::EscrowCancelled);
                }

                // Validar que no está completado
                if escrow.is_completed {
                    return Err(EscrowError::EscrowCompleted);
                }

                // Validar índice
                if milestone_index as usize >= escrow.milestones.len() {
                    return Err(EscrowError::InvalidMilestoneIndex);
                }

                // Validar que el hito no fue liberado
                if escrow.milestones[milestone_index as usize].is_released {
                    return Err(EscrowError::MilestoneAlreadyReleased);
                }

                // Liberar fondos
                let milestone = &mut escrow.milestones[milestone_index as usize];
                let amount = milestone.amount;

                // Transferir fondos al project_owner
                if self.env().transfer(escrow.project_owner, amount).is_err() {
                    return Err(EscrowError::TransferFailed);
                }

                // Actualizar estado
                milestone.is_released = true;
                milestone.released_at = self.env().block_timestamp();
                escrow.released_amount += amount;
                escrow.remaining_amount -= amount;

                // Verificar si todos los hitos fueron liberados
                if escrow.milestones.iter().all(|m| m.is_released) {
                    escrow.is_completed = true;
                }

                self.escrows.insert(caller, &escrow);

                // Emitir evento
                self.env().emit_event(FundsReleased {
                    project_owner: caller,
                    milestone_index,
                    amount,
                });

                Ok(())
            }

            /// Cancelar el escrow y devolver los fondos restantes al admin
            #[ink(message)]
            pub fn cancel_escrow(&mut self) -> Result<(), EscrowError> {
                let caller = self.env().caller();
                let mut escrow = self
                    .escrows
                    .get(&caller)
                    .ok_or(EscrowError::EscrowNotFound)?;

                // Solo el admin puede cancelar
                if caller != escrow.admin {
                    return Err(EscrowError::Unauthorized);
                }

                // No se puede cancelar si ya está cancelado o completado
                if escrow.is_cancelled || escrow.is_completed {
                    return Err(EscrowError::CannotCancelEscrow);
                }

                let remaining = escrow.remaining_amount;

                // Devolver fondos restantes al admin
                if remaining > 0 {
                    if self.env().transfer(caller, remaining).is_err() {
                        return Err(EscrowError::TransferFailed);
                    }
                }

                // Marcar como cancelado
                escrow.is_cancelled = true;
                self.escrows.insert(caller, &escrow);

                // Emitir evento
                self.env().emit_event(EscrowCancelled {
                    project_owner: caller,
                    remaining_amount: remaining,
                });

                Ok(())
            }

            /// Registrar progreso del proyecto (vinculado con Arkiv)
            #[ink(message)]
            pub fn record_progress(
                &mut self,
                milestone_index: u32,
                progress_notes: Vec<u8>,
            ) -> Result<(), EscrowError> {
                let caller = self.env().caller();
                let escrow = self
                    .escrows
                    .get(&caller)
                    .ok_or(EscrowError::EscrowNotFound)?;

                // Solo el project_owner puede registrar progreso
                if caller != escrow.project_owner {
                    return Err(EscrowError::Unauthorized);
                }

                // Validar que el escrow no está cancelado
                if escrow.is_cancelled {
                    return Err(EscrowError::EscrowCancelled);
                }

                // Validar índice
                if milestone_index as usize >= escrow.milestones.len() {
                    return Err(EscrowError::InvalidMilestoneIndex);
                }

                // Emitir evento con el progreso
                // Este evento será escuchado por Arkiv para registrar el avance
                self.env().emit_event(ProgressRecorded {
                    project_owner: caller,
                    milestone_index,
                    progress_notes,
                });

                Ok(())
            }

            /// Obtener información del escrow
            #[ink(message)]
            pub fn get_escrow(&self, project_owner: AccountId) -> Option<EscrowInfo> {
                self.escrows.get(project_owner).map(|escrow| EscrowInfo {
                    project_owner: escrow.project_owner,
                    admin: escrow.admin,
                    total_amount: escrow.total_amount,
                    released_amount: escrow.released_amount,
                    remaining_amount: escrow.remaining_amount,
                    is_cancelled: escrow.is_cancelled,
                    is_completed: escrow.is_completed,
                    milestone_count: escrow.milestones.len() as u32,
                })
            }

            /// Obtener detalles de un hito
            #[ink(message)]
            pub fn get_milestone(
                &self,
                project_owner: AccountId,
                milestone_index: u32,
            ) -> Option<MilestoneInfo> {
                self.escrows.get(project_owner).and_then(|escrow| {
                    escrow
                        .milestones
                        .get(milestone_index as usize)
                        .map(|milestone| MilestoneInfo {
                            release_percentage: milestone.release_percentage,
                            amount: milestone.amount,
                            is_released: milestone.is_released,
                            released_at: milestone.released_at,
                        })
                })
            }

            /// Obtener metadatos del proyecto
            #[ink(message)]
            pub fn get_project_metadata(&self, project_owner: AccountId) -> Option<ProjectMetadataInfo> {
                self.escrows.get(project_owner).map(|escrow| ProjectMetadataInfo {
                    project_id: escrow.project_metadata.project_id.clone(),
                    project_name: escrow.project_metadata.project_name.clone(),
                    arkiv_entity_url: escrow.project_metadata.arkiv_entity_url.clone(),
                    created_at: escrow.project_metadata.created_at,
                })
            }
        }

        /// Información simplificada del escrow para retornar
        #[derive(Encode, Decode)]
        #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
        pub struct EscrowInfo {
            pub project_owner: AccountId,
            pub admin: AccountId,
            pub total_amount: Balance,
            pub released_amount: Balance,
            pub remaining_amount: Balance,
            pub is_cancelled: bool,
            pub is_completed: bool,
            pub milestone_count: u32,
        }

        /// Información simplificada de un hito
        #[derive(Encode, Decode)]
        #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
        pub struct MilestoneInfo {
            pub release_percentage: u32,
            pub amount: Balance,
            pub is_released: bool,
            pub released_at: u64,
        }

        /// Información simplificada de metadatos del proyecto
        #[derive(Encode, Decode)]
        #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
        pub struct ProjectMetadataInfo {
            pub project_id: Vec<u8>,
            pub project_name: Vec<u8>,
            pub arkiv_entity_url: Vec<u8>,
            pub created_at: u64,
        }

        /// Errores posibles
        #[derive(Encode, Decode)]
        #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, Debug))]
        pub enum EscrowError {
            /// No se envió dinero suficiente
            InsufficientFunds,
            /// Ya existe un escrow para esta cuenta
            EscrowAlreadyExists,
            /// Los porcentajes de los hitos no suman 100
            InvalidMilestonePercentages,
            /// La cantidad de descripciones no coincide con los porcentajes
            MilestoneCountMismatch,
            /// No existe escrow para esta cuenta
            EscrowNotFound,
            /// Índice de hito inválido
            InvalidMilestoneIndex,
            /// El hito ya fue liberado
            MilestoneAlreadyReleased,
            /// Fallo al transferir fondos
            TransferFailed,
            /// El escrow está cancelado
            EscrowCancelled,
            /// El escrow está completado
            EscrowCompleted,
            /// No está autorizado
            Unauthorized,
            /// No se puede cancelar este escrow
            CannotCancelEscrow,
        }
    }
}
