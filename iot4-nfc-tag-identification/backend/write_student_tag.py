#!/usr/bin/env python3
import argparse
import json
from nfc import init_pn532, write_json_to_nfc, read_json_from_nfc


def prepare_nfc_data(policy_id, asset_name_hex, student_id):
    return {
        "p": policy_id,
        "a": asset_name_hex,
        "s": student_id,
    }


def write_student_tag(policy_id, asset_name_hex, student_id):
    print("\n=== Writing Student Data to NFC Tag ===")
    print(f"Policy ID: {policy_id}")
    print(f"Asset Name Hex: {asset_name_hex}")
    print(f"Student ID: {student_id}")

    nfc_data = prepare_nfc_data(policy_id, asset_name_hex, student_id)
    print(f"\nNFC Data to write:")
    print(json.dumps(nfc_data, indent=2))

    data_size = len(json.dumps(nfc_data))
    print(f"Data size: {data_size} bytes")

    if data_size > 96:
        print("WARNING: Data exceeds 96 bytes, may need multiple sectors")

    pn532 = init_pn532()

    print("\nPlace NFC tag on reader...")
    success = write_json_to_nfc(pn532, nfc_data, debug=True)

    if success:
        print("\n✓ Student data written to NFC tag successfully!")
        print("\nVerifying write...")
        verify_data = read_json_from_nfc(pn532, num_blocks=8, debug=False)
        if verify_data:
            print("✓ Verification successful!")
            print(f"Read back: {json.dumps(verify_data)}")
            return True
        else:
            print("✗ Verification failed - could not read back data")
            return False
    else:
        print("✗ Failed to write data to NFC tag")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Write student NFT reference to NFC tag")
    parser.add_argument("--policy", required=True, help="Policy ID (hex)")
    parser.add_argument("--asset", required=True, help="Asset name (hex)")
    parser.add_argument("--id", required=True, help="Student ID")

    args = parser.parse_args()

    success = write_student_tag(
        policy_id=args.policy, asset_name_hex=args.asset, student_id=args.id
    )

    if success:
        print("\nTo verify student, run:")
        print("python verify_student.py")
