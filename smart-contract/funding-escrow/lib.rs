#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
pub mod funding_escrow {
    use ink::prelude::vec::Vec;
    use scale::{Decode, Encode};

    #[ink(event)]
    pub struct EscrowCreated {
        #[ink(topic)]
        project_owner: AccountId,
        total_amount: Balance,
        milestone_count: u32,
    }

    #[ink(event)]
    pub struct FundsReleased {
        #[ink(topic)]
        project_owner: AccountId,
        milestone_index: u32,
        amount: Balance,
    }

    #[ink(event)]
    pub struct EscrowCancelled {
        #[ink(topic)]
        project_owner: AccountId,
        remaining_amount: Balance,
    }

    #[ink(storage)]
    pub struct FundingEscrowContract {
        // Información de escrow por proyecto
        escrow_owners: ink::storage::Mapping<AccountId, AccountId>, // project_owner -> admin
        escrow_amounts: ink::storage::Mapping<AccountId, Balance>,  // project_owner -> total_amount
        escrow_released: ink::storage::Mapping<AccountId, Balance>, // project_owner -> released_amount
        escrow_remaining: ink::storage::Mapping<AccountId, Balance>, // project_owner -> remaining_amount
        escrow_cancelled: ink::storage::Mapping<AccountId, bool>,   // project_owner -> is_cancelled
        escrow_completed: ink::storage::Mapping<AccountId, bool>,   // project_owner -> is_completed
        
        // Información de milestones
        milestone_counts: ink::storage::Mapping<AccountId, u32>,    // project_owner -> count
        milestone_percentages: ink::storage::Mapping<(AccountId, u32), u32>, // (owner, index) -> percentage
        milestone_amounts: ink::storage::Mapping<(AccountId, u32), Balance>, // (owner, index) -> amount
        milestone_released: ink::storage::Mapping<(AccountId, u32), bool>,   // (owner, index) -> released
        milestone_released_at: ink::storage::Mapping<(AccountId, u32), u64>, // (owner, index) -> timestamp
        
        active_projects: Vec<AccountId>,
        project_count: u32,
    }

    impl FundingEscrowContract {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                escrow_owners: ink::storage::Mapping::new(),
                escrow_amounts: ink::storage::Mapping::new(),
                escrow_released: ink::storage::Mapping::new(),
                escrow_remaining: ink::storage::Mapping::new(),
                escrow_cancelled: ink::storage::Mapping::new(),
                escrow_completed: ink::storage::Mapping::new(),
                milestone_counts: ink::storage::Mapping::new(),
                milestone_percentages: ink::storage::Mapping::new(),
                milestone_amounts: ink::storage::Mapping::new(),
                milestone_released: ink::storage::Mapping::new(),
                milestone_released_at: ink::storage::Mapping::new(),
                active_projects: Vec::new(),
                project_count: 0,
            }
        }

        #[ink(message, payable)]
        pub fn create_escrow(
            &mut self,
            project_owner: AccountId,
            milestone_count: u32,
        ) -> Result<(), EscrowError> {
            let deposited = self.env().transferred_value();
            if deposited == 0 {
                return Err(EscrowError::InsufficientFunds);
            }

            if self.escrow_owners.contains(project_owner) {
                return Err(EscrowError::EscrowAlreadyExists);
            }

            if milestone_count == 0 {
                return Err(EscrowError::InvalidMilestoneCount);
            }

            self.escrow_owners.insert(project_owner, &self.env().caller());
            self.escrow_amounts.insert(project_owner, &deposited);
            self.escrow_released.insert(project_owner, &0);
            self.escrow_remaining.insert(project_owner, &deposited);
            self.escrow_cancelled.insert(project_owner, &false);
            self.escrow_completed.insert(project_owner, &false);
            self.milestone_counts.insert(project_owner, &milestone_count);

            self.active_projects.push(project_owner);
            self.project_count = self.project_count.saturating_add(1);

            self.env().emit_event(EscrowCreated {
                project_owner,
                total_amount: deposited,
                milestone_count,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn add_milestone(
            &mut self,
            project_owner: AccountId,
            milestone_index: u32,
            release_percentage: u32,
        ) -> Result<(), EscrowError> {
            let total_amount = self
                .escrow_amounts
                .get(project_owner)
                .ok_or(EscrowError::EscrowNotFound)?;

            if let Some(count) = self.milestone_counts.get(project_owner) {
                if milestone_index >= count {
                    return Err(EscrowError::InvalidMilestoneIndex);
                }
            } else {
                return Err(EscrowError::EscrowNotFound);
            }

            if self.milestone_percentages.contains((project_owner, milestone_index)) {
                return Err(EscrowError::MilestoneAlreadyExists);
            }

            let amount = total_amount.saturating_div(100).saturating_mul(release_percentage as u128);

            self.milestone_percentages.insert((project_owner, milestone_index), &release_percentage);
            self.milestone_amounts.insert((project_owner, milestone_index), &amount);
            self.milestone_released.insert((project_owner, milestone_index), &false);
            self.milestone_released_at.insert((project_owner, milestone_index), &0);

            Ok(())
        }

        #[ink(message)]
        pub fn release_milestone(
            &mut self,
            project_owner: AccountId,
            milestone_index: u32,
        ) -> Result<(), EscrowError> {
            if let Some(is_cancelled) = self.escrow_cancelled.get(project_owner) {
                if is_cancelled {
                    return Err(EscrowError::EscrowCancelled);
                }
            }

            if let Some(is_completed) = self.escrow_completed.get(project_owner) {
                if is_completed {
                    return Err(EscrowError::EscrowCompleted);
                }
            }

            if let Some(count) = self.milestone_counts.get(project_owner) {
                if milestone_index >= count {
                    return Err(EscrowError::InvalidMilestoneIndex);
                }
            }

            let amount = self
                .milestone_amounts
                .get((project_owner, milestone_index))
                .ok_or(EscrowError::MilestoneNotFound)?;

            if let Some(is_released) = self.milestone_released.get((project_owner, milestone_index)) {
                if is_released {
                    return Err(EscrowError::MilestoneAlreadyReleased);
                }
            }

            if self.env().transfer(project_owner, amount).is_err() {
                return Err(EscrowError::TransferFailed);
            }

            self.milestone_released.insert((project_owner, milestone_index), &true);
            self.milestone_released_at.insert((project_owner, milestone_index), &self.env().block_timestamp());

            let released_amount = self.escrow_released.get(project_owner).unwrap_or(0);
            let remaining_amount = self.escrow_remaining.get(project_owner).unwrap_or(0);

            self.escrow_released.insert(project_owner, &released_amount.saturating_add(amount));
            self.escrow_remaining.insert(project_owner, &remaining_amount.saturating_sub(amount));

            self.env().emit_event(FundsReleased {
                project_owner,
                milestone_index,
                amount,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn cancel_escrow(&mut self, project_owner: AccountId) -> Result<(), EscrowError> {
            let admin = self
                .escrow_owners
                .get(project_owner)
                .ok_or(EscrowError::EscrowNotFound)?;

            if self.env().caller() != admin {
                return Err(EscrowError::Unauthorized);
            }

            if let Some(is_cancelled) = self.escrow_cancelled.get(project_owner) {
                if is_cancelled {
                    return Err(EscrowError::CannotCancelEscrow);
                }
            }

            if let Some(is_completed) = self.escrow_completed.get(project_owner) {
                if is_completed {
                    return Err(EscrowError::CannotCancelEscrow);
                }
            }

            let remaining = self.escrow_remaining.get(project_owner).unwrap_or(0);

            if remaining > 0 {
                if self.env().transfer(admin, remaining).is_err() {
                    return Err(EscrowError::TransferFailed);
                }
            }

            self.escrow_cancelled.insert(project_owner, &true);

            self.env().emit_event(EscrowCancelled {
                project_owner,
                remaining_amount: remaining,
            });

            Ok(())
        }

        #[ink(message)]
        pub fn get_escrow_status(&self, project_owner: AccountId) -> Option<(Balance, Balance, bool, bool)> {
            let total = self.escrow_amounts.get(project_owner)?;
            let released = self.escrow_released.get(project_owner).unwrap_or(0);
            let cancelled = self.escrow_cancelled.get(project_owner).unwrap_or(false);
            let completed = self.escrow_completed.get(project_owner).unwrap_or(false);

            Some((total, released, cancelled, completed))
        }

        #[ink(message)]
        pub fn get_milestone_status(
            &self,
            project_owner: AccountId,
            milestone_index: u32,
        ) -> Option<(Balance, bool)> {
            let amount = self.milestone_amounts.get((project_owner, milestone_index))?;
            let released = self.milestone_released.get((project_owner, milestone_index)).unwrap_or(false);

            Some((amount, released))
        }

        #[ink(message)]
        pub fn get_project_count(&self) -> u32 {
            self.project_count
        }
    }

    #[derive(Encode, Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, Debug))]
    pub enum EscrowError {
        InsufficientFunds,
        EscrowAlreadyExists,
        EscrowNotFound,
        InvalidMilestoneIndex,
        InvalidMilestoneCount,
        MilestoneAlreadyExists,
        MilestoneNotFound,
        MilestoneAlreadyReleased,
        TransferFailed,
        EscrowCancelled,
        EscrowCompleted,
        Unauthorized,
        CannotCancelEscrow,
    }
}
