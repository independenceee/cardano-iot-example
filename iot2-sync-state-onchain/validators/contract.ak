use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/assets.{PolicyId, flatten, without_lovelace}
use cardano/transaction.{
  InlineDatum, Output, OutputReference, Transaction, find_input,
}
use cardano/tx
use validation/find.{output_by_addr_value}

// --------------------------------------
//  Type: Address
// --------------------------------------
//  Purpose:
//  Defines the structure used to represent an address within this validator.
//  Instead of using Cardano's built-in address format, this simplified type
//  separates the payment and stake verification key hashes, enabling easier
//  signature and authority validation within the smart contract.
//
//  Structure:
//  - payment: VerificationKeyHash
//      The hash of the public key used for transaction payment validation.
//      This key must sign transactions to prove control over UTxOs.
//  - stake: VerificationKeyHash
//      The hash of the staking key associated with the same address.
//      Used primarily for on-chain identity consistency or future delegation logic.
//
//  Behavior:
//  - Both `payment` and `stake` must correspond to a valid address used
//    in the Cardano network.
//  - When checking signatures, only the `payment` key is validated via
//    `tx.verify_signature(...)`.
//  - The stake key is retained for potential use in governance or staking rules.
//
//  Security Notes:
//  - Provides clear separation between payment authority and staking ownership.
//  - Prevents ambiguity in authority verification within Datum structures.
pub type Address {
  payment: VerificationKeyHash,
  stake: VerificationKeyHash,
}

// --------------------------------------
//  Type: Datum
// --------------------------------------
//  Purpose:
//  Defines the state data stored on-chain for each UTxO locked by this validator.
//  It determines who has authority over the UTxO and whether it is currently
//  in a locked or unlocked state.
//
//  Structure:
//  - authority: Address
//      The on-chain identity that has permission to perform certain actions
//      (such as locking/unlocking). 
//      Includes both payment and stake verification key hashes for full 
//      address-level authorization.
//  - is_locked: Int
//      Indicates the current lock state of the UTxO.
//      * 0 → Unlocked: The UTxO can be freely interacted with, provided
//        the appropriate signature (owner or authority) is present.
//      * 1 → Locked: The UTxO is in a restricted state. Only authorized
//        actions or state transitions can unlock it.
//
//  Behavior:
//  - The Datum must remain consistent between input and output UTxOs.
//  - The authority field cannot change across transactions to prevent 
//    unauthorized transfer of control.
//  - is_locked is toggled only when explicitly allowed via the Redeemer.
//
//  Security Notes:
//  - Prevents arbitrary modification of authority or state.
//  - Ensures on-chain UTxOs have a well-defined access control model.
pub type Datum {
  authority: Address,
  is_locked: Int,
}

// --------------------------------------
//  Type: Redeemer
// --------------------------------------
//  Purpose:
//  Specifies the action or intent of the transaction spending the UTxO.
//  Each variant defines a specific control flow within the validator logic.
//
//  Variants:
//
//  - Status:
//      Used when toggling or confirming the lock state (`is_locked`) of a UTxO.
//      Allows either the contract owner or the authority (as specified in Datum)
//      to initiate the transaction.
//      Behavior:
//      * Verifies that the lock state transition follows contract rules.
//      * Requires a valid signature from owner or authority.
//      * Prevents authority changes between input and output.
//
//  - Authorize:
//      Used for privileged management or administrative actions that require
//      full ownership authority.
//      Behavior:
//      * Only the contract owner’s signature is accepted.
//      * Typically used to approve actions that modify broader contract state.
//
//  Security Notes:
//  - Enforces role-based control logic at the validator level.
//  - Prevents unauthorized state transitions by clearly distinguishing
//    intent via redeemer type.
pub type Redeemer {
  Status
  Authorize
}

// --------------------------------------
//  Validator: locker
// --------------------------------------
//  Purpose:
//  Controls the spending of UTxOs that include a `Datum` representing
//  a lock/unlock state. This validator enforces access control and
//  transition logic based on redeemer actions.
//
//  Parameters:
//  - owner: VerificationKeyHash
//      The designated contract owner who can authorize or unlock states.
//
//  Redeemers:
//  - Status:
//      * Toggles the lock state of the UTxO (`is_locked` field).
//      * Requires a valid signature from either the `owner` or the `authority`.
//      * Prevents unauthorized authority change.
//      * Ensures the output datum accurately reflects the lock state.
//  - Authorize:
//      * Only executable by the `owner` (requires owner’s signature).
//
//  Security Notes:
//  - Prevents unauthorized state transitions or authority reassignment.
//  - Validates that all resulting UTxOs maintain a consistent datum structure.
// --------------------------------------
validator locker(owner: VerificationKeyHash) {
  // --------------------------------------
  //  mint
  // --------------------------------------
  //  Purpose:
  //  Verifies that minting transactions are authorized by the owner.
  //  Used when the contract needs to control asset creation or policy actions.
  //
  //  Parameters:
  //  - owner: VerificationKeyHash → Contract owner’s key hash.
  //  - transaction: Transaction → Full transaction context.
  //
  //  Security:
  //  Ensures that only the designated owner can initiate minting actions.
  mint(_redeemer: Void, _policy_id: PolicyId, transaction: Transaction) {
    let Transaction { extra_signatories, .. } = transaction
    tx.verify_signature(extra_signatories, owner)
  }

  // --------------------------------------
  //  spend
  // --------------------------------------
  //  Purpose:
  //  Handles spending of UTxOs governed by this validator.
  //  Validates that transitions between locked/unlocked states
  //  are authorized and consistent.
  //
  //  Parameters:
  //  - datum_opt: Option<Datum> → The inline datum attached to the input UTxO.
  //  - redeemer: Redeemer → Action type (Status / Authorize).
  //  - output_reference: OutputReference → The reference of the input being spent.
  //  - transaction: Transaction → Full transaction context.
  //
  //  Behavior:
  //  - Extracts and validates the datum from the input.
  //  - Confirms matching authority between input and output.
  //  - Applies logic based on redeemer type.
  //
  //  Security:
  //  - Prevents unauthorized UTxO manipulation.
  //  - Ensures that output datum correctly reflects the lock state.
  spend(
    datum_opt: Option<Datum>,
    redeemer: Redeemer,
    output_reference: OutputReference,
    transaction: Transaction,
  ) {
    expect Some(datum_input) = datum_opt
    let Transaction { inputs, outputs, extra_signatories, .. } = transaction
    expect Some(input) = find_input(inputs, output_reference)
    let script_address = input.output.address
    let token =
      input.output.value
        |> without_lovelace()
    let utxo_output = output_by_addr_value(outputs, script_address, token)
    expect InlineDatum(datum_output_inline) = utxo_output.datum
    expect datum_output: Datum = datum_output_inline
    let owner_sign = tx.verify_signature(extra_signatories, owner)
    let authority_sign =
      tx.verify_signature(extra_signatories, datum_input.authority.payment)
    let change_authority = datum_input.authority == datum_output.authority
    let utxo_output = output_by_addr_value(outputs, script_address, token)

    when redeemer is {
      // --------------------------------------
      //  Redeemer: Status
      // --------------------------------------
      //  Logic:
      //  Toggles UTxO state between locked/unlocked based on `is_locked`.
      //  Requirements:
      //  - One valid output must be created.
      //  - Must be signed by either owner or authority.
      //  - Authority must remain unchanged.
      //  - Output datum must reflect the same lock state.
      Status ->
        when datum_input.is_locked == 0 is {
          // Case: The datum is unlocked (is_locked == 0).
          // Requirements:
          // - Ensure exactly 1 UTxO is produced in the output.
          // - Either the owner or the authority must sign the transaction.
          // - The authority can be updated if required.
          // - The output datum must keep the same lock status as the input.
          True -> and {
              check_output_utxo(utxo_output, 1),
              or {
                owner_sign,
                authority_sign,
              },
              change_authority,
              datum_output.is_locked == datum_input.is_locked,
            }
          // Case: The datum is locked (is_locked != 0).
          // Requirements are the same as the unlocked case,
          // except that the output UTxO must contain 0.
          False -> and {
              check_output_utxo(utxo_output, 0),
              or {
                owner_sign,
                authority_sign,
              },
              change_authority,
              datum_output.is_locked == datum_input.is_locked,
            }
        }
      // --------------------------------------
      //  Redeemer: Authorize
      // --------------------------------------
      //  Logic:
      //  Only allows execution if the transaction is signed by the owner.
      //  Used for restricted management operations.
      Authorize -> owner_sign
    }
  }

  else(_) {
    fail
  }
}

// --------------------------------------
//  Function: check_output_utxo
// --------------------------------------
//  Purpose:
//  Validates the newly created output UTxO when a state transition occurs.
//
//  Parameters:
//  - output: Output → The UTxO created by the transaction.
//  - is_lock: Int → Expected lock state (0 = unlocked, 1 = locked).
//
//  Behavior:
//  - Ensures the output contains a valid InlineDatum of type `Datum`.
//  - Confirms `is_locked` matches the expected value.
//  - Validates that the UTxO carries exactly one asset type (excluding lovelace).
//
//  Security:
//  Prevents creation of malformed or unauthorized replacement UTxOs.
pub fn check_output_utxo(output: Output, is_lock: Int) -> Bool {
  expect InlineDatum(data) = output.datum
  expect datum: Datum = data
  let output_value =
    output.value
      |> without_lovelace()
      |> flatten()
  and {
    datum.is_locked == is_lock,
    list.length(output_value) == 1,
  }
}
