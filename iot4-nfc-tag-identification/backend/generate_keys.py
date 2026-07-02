#!/usr/bin/env python3
"""
One-time utility to generate an Ed25519 keypair used to sign/verify
NFC tag payloads.

Run this once:
    python generate_keys.py

Copy the PRIVATE KEY into your .env as TAG_SIGNING_PRIVATE_KEY
(keep it secret — ideally in a secret manager, not committed to git).

Copy the PUBLIC KEY into your .env as TAG_SIGNING_PUBLIC_KEY
(safe to store in config, used only for verification).

After running once and saving both keys, delete this file — it should
not remain in the repository.
"""
from nacl.signing import SigningKey
import base64


def main():
    signing_key = SigningKey.generate()
    verify_key = signing_key.verify_key

    private_b64 = base64.b64encode(bytes(signing_key)).decode()
    public_b64 = base64.b64encode(bytes(verify_key)).decode()

    print("=" * 60)
    print("TAG_SIGNING_PRIVATE_KEY (secret — do not commit)")
    print("=" * 60)
    print(private_b64)

    print("\n" + "=" * 60)
    print("TAG_SIGNING_PUBLIC_KEY (safe to store in config)")
    print("=" * 60)
    print(public_b64)

    print("\nAdd both to your .env file, then delete this script.")


if __name__ == "__main__":
    main()