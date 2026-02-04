#!/usr/bin/env python3
import os
import sys
import time
from datetime import datetime
from nfc import init_pn532, read_json_from_nfc
from cardano import query_asset, check_connection
from config import validate_config


def clear_screen():
    os.system('clear' if os.name != 'nt' else 'cls')


def verify_on_blockchain(policy_id, asset_name_hex, student_id):
    asset = query_asset(policy_id, asset_name_hex)

    if not asset:
        return {"verified": False, "error": "NFT not found", "student_id": student_id}

    metadata = asset.get("onchain_metadata", {})
    onchain_student_id = metadata.get("student_id", "")

    if str(onchain_student_id) != str(student_id):
        return {"verified": False, "error": "ID mismatch", "student_id": student_id}

    return {
        "verified": True,
        "student_id": onchain_student_id,
        "student_name": metadata.get("student_name", ""),
        "department": metadata.get("department", ""),
        "issued_at": metadata.get("issued_at", ""),
    }


def display_result(result, last_scan_time):
    clear_screen()
    print("=" * 50)
    print("  STUDENT VERIFICATION SYSTEM")
    print("=" * 50)
    print(f"  Last scan: {last_scan_time}")
    print("=" * 50)

    if result is None:
        print("\n  Waiting for card...\n")
        print("  Place student NFC card on reader")
    elif result["verified"]:
        print("\n  ✓ VERIFIED\n")
        print(f"  ID:         {result['student_id']}")
        print(f"  Name:       {result['student_name']}")
        print(f"  Department: {result['department']}")
        print(f"  Issued:     {result['issued_at']}")
    else:
        print("\n  ✗ FAILED\n")
        print(f"  Error: {result.get('error', 'Unknown')}")
        if result.get('student_id'):
            print(f"  Card ID: {result['student_id']}")

    print("\n" + "=" * 50)
    print("  Press Ctrl+C to exit")
    print("=" * 50)


def try_read_card(pn532):
    uid = pn532.read_passive_target(timeout=0.5)
    if uid is None:
        return None, None

    uid_str = "".join(f"{b:02X}" for b in uid)
    data = read_json_from_nfc(pn532, num_blocks=8, debug=False)
    return uid_str, data


def continuous_verify():
    errors = validate_config()
    if errors:
        print("Config errors:", errors)
        return

    if not check_connection():
        print("Cannot connect to Blockfrost")
        return

    pn532 = init_pn532()

    last_result = None
    last_scan_time = "Never"
    last_uid = None

    display_result(None, last_scan_time)

    while True:
        try:
            uid_str, nfc_data = try_read_card(pn532)

            if uid_str and uid_str != last_uid:
                if nfc_data and all(f in nfc_data for f in ["p", "a", "s"]):
                    last_result = verify_on_blockchain(
                        nfc_data["p"], nfc_data["a"], nfc_data["s"]
                    )
                    last_scan_time = datetime.now().strftime("%H:%M:%S")
                    last_uid = uid_str
                    display_result(last_result, last_scan_time)
                else:
                    last_result = {"verified": False, "error": "Invalid card data"}
                    last_scan_time = datetime.now().strftime("%H:%M:%S")
                    last_uid = uid_str
                    display_result(last_result, last_scan_time)

            time.sleep(0.3)

        except KeyboardInterrupt:
            print("\n\nExiting...")
            break
        except Exception as e:
            print(f"\nError: {e}")
            time.sleep(1)


def verify_student():
    errors = validate_config()
    if errors:
        print("Config errors:", errors)
        return None

    if not check_connection():
        print("Cannot connect to Blockfrost")
        return None

    pn532 = init_pn532()

    print("\nPlace student card on reader...")
    data = read_json_from_nfc(pn532, num_blocks=8, debug=False)

    if not data:
        print("Could not read NFC tag")
        return None

    if not all(f in data for f in ["p", "a", "s"]):
        print("Invalid NFC data")
        return None

    print("Querying blockchain...")
    result = verify_on_blockchain(data["p"], data["a"], data["s"])

    print("\n" + "=" * 50)
    if result["verified"]:
        print("✓ STUDENT VERIFIED")
        print("=" * 50)
        print(f"  ID:         {result['student_id']}")
        print(f"  Name:       {result['student_name']}")
        print(f"  Department: {result['department']}")
        print(f"  Issued:     {result['issued_at']}")
    else:
        print("✗ VERIFICATION FAILED")
        print("=" * 50)
        print(f"  Error: {result.get('error', 'Unknown')}")
    print("=" * 50)

    return result


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Verify student via NFC + blockchain")
    parser.add_argument("-c", "--continuous", action="store_true", help="Daemon mode")
    args = parser.parse_args()

    if args.continuous:
        continuous_verify()
    else:
        verify_student()
