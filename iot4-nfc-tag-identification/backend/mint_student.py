#!/usr/bin/env python3
import json
from datetime import datetime

from pycardano import (
    TransactionBuilder,
    TransactionOutput,
    Value,
    Metadata,
    AuxiliaryData,
    AlonzoMetadata,
    MultiAsset,
    Asset,
    AssetName,
    Transaction,
    TransactionWitnessSet,
    VerificationKeyWitness,
)
from cardano import init_context, load_wallet, load_policy_key, check_connection
from config import validate_config


def get_input(prompt, default=""):
    if default:
        value = input(f"{prompt} [{default}]: ").strip()
        return value if value else default
    return input(f"{prompt}: ").strip()


def mint_student():
    print("\n" + "=" * 50)
    print("  MINT STUDENT NFT")
    print("=" * 50)

    errors = validate_config()
    if errors:
        print("\n✗ Config errors:")
        for e in errors:
            print(f"  - {e}")
        return

    if not check_connection():
        print("\n✗ Cannot connect to Blockfrost")
        return
    print("\n✓ Blockfrost connected")

    print("\n--- Student Information ---")
    student_id = get_input("Student ID")
    if not student_id:
        print("✗ Student ID required")
        return

    name = get_input("Full Name")
    if not name:
        print("✗ Name required")
        return

    department = get_input("Department", "Computer Science")
    nfc_uid = get_input("NFC UID (optional)", "")

    print("\n--- Initializing ---")
    context = init_context()
    payment_skey, payment_vkey, address = load_wallet()
    policy_skey, policy_vkey, policy_script, policy_id = load_policy_key()
    policy_id_hex = policy_id.payload.hex()

    print(f"Wallet: {address}")
    print(f"Policy: {policy_id_hex}")

    utxos = context.utxos(str(address))
    if not utxos:
        print(f"\n✗ No funds. Send ADA to: {address}")
        return

    balance = sum(u.output.amount.coin for u in utxos) / 1_000_000
    print(f"Balance: {balance} ADA")

    print("\n--- Summary ---")
    print(f"  Student ID: {student_id}")
    print(f"  Name: {name}")
    print(f"  Department: {department}")
    print(f"  NFC UID: {nfc_uid or 'N/A'}")

    confirm = input("\nMint NFT? [Y/n]: ").strip().lower()
    if confirm == "n":
        print("Cancelled.")
        return

    print("\n--- Minting ---")
    asset_name = f"STU{student_id}"
    asset_name_bytes = asset_name.encode("utf-8")

    metadata = {
        721: {
            policy_id_hex: {
                asset_name: {
                    "name": f"Student: {name}",
                    "student_id": student_id,
                    "student_name": name,
                    "department": department,
                    "nfc_uid": nfc_uid,
                    "issued_at": datetime.now().strftime("%Y-%m-%d"),
                    "issuer": "Student ID System",
                }
            }
        }
    }

    auxiliary_data = AuxiliaryData(AlonzoMetadata(metadata=Metadata(metadata)))
    my_nft = MultiAsset()
    my_nft[policy_id] = Asset({AssetName(asset_name_bytes): 1})

    builder = TransactionBuilder(context)
    builder.add_input_address(address)
    builder.mint = my_nft
    builder.native_scripts = [policy_script]
    builder.auxiliary_data = auxiliary_data
    builder.add_output(TransactionOutput(address, Value(2000000, my_nft)))

    print("Building transaction...")
    tx_body = builder.build(change_address=address)

    print("Signing...")
    witness_set = TransactionWitnessSet()
    witness_set.vkey_witnesses = [
        VerificationKeyWitness(payment_vkey, payment_skey.sign(tx_body.hash())),
        VerificationKeyWitness(policy_vkey, policy_skey.sign(tx_body.hash())),
    ]
    witness_set.native_scripts = [policy_script]

    signed_tx = Transaction(tx_body, witness_set, auxiliary_data=auxiliary_data)

    print("Submitting...")
    tx_id = context.submit_tx(signed_tx)

    result = {
        "tx_id": str(tx_id),
        "policy_id": policy_id_hex,
        "asset_name": asset_name,
        "asset_name_hex": asset_name_bytes.hex(),
        "student_id": student_id,
    }

    print("\n" + "=" * 50)
    print("  ✓ NFT MINTED")
    print("=" * 50)
    print(json.dumps(result, indent=2))

    print("\nTo write to NFC:")
    print(f"python write_student_tag.py --policy {policy_id_hex} --asset {asset_name_bytes.hex()} --id {student_id}")


if __name__ == "__main__":
    mint_student()
