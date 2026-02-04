import os
from dotenv import load_dotenv

load_dotenv()

BLOCKFROST_PROJECT_ID = os.getenv("BLOCKFROST_PROJECT_ID", "")
CARDANO_NETWORK = BLOCKFROST_PROJECT_ID[:7] if BLOCKFROST_PROJECT_ID else "preprod"
MNEMONIC = os.getenv("MNEMONIC", "")

BLOCKFROST_BASE_URL = {
    "mainnet": "https://cardano-mainnet.blockfrost.io/api",
    "preprod": "https://cardano-preprod.blockfrost.io/api",
    "preview": "https://cardano-preview.blockfrost.io/api",
}

def get_blockfrost_url():
    return BLOCKFROST_BASE_URL.get(CARDANO_NETWORK, BLOCKFROST_BASE_URL["preprod"])

def validate_config():
    errors = []
    if not BLOCKFROST_PROJECT_ID:
        errors.append("BLOCKFROST_PROJECT_ID not set")
    if not MNEMONIC:
        errors.append("MNEMONIC not set")
    return errors
