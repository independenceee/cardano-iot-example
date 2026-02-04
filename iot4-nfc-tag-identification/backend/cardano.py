import requests
from pycardano import (
    BlockFrostChainContext,
    PaymentSigningKey,
    PaymentVerificationKey,
    Address,
    Network,
    HDWallet,
    ScriptAll,
    ScriptPubkey,
)
from config import (
    BLOCKFROST_PROJECT_ID,
    CARDANO_NETWORK,
    MNEMONIC,
    get_blockfrost_url,
)

_cached_hdwallet = None

def _get_hdwallet():
    global _cached_hdwallet
    if _cached_hdwallet is None:
        _cached_hdwallet = HDWallet.from_mnemonic(MNEMONIC)
    return _cached_hdwallet

def _get_network():
    return Network.TESTNET if CARDANO_NETWORK != "mainnet" else Network.MAINNET

def init_context():
    return BlockFrostChainContext(
        project_id=BLOCKFROST_PROJECT_ID,
        base_url=get_blockfrost_url(),
    )

def load_wallet():
    hdwallet = _get_hdwallet()
    payment_key = hdwallet.derive_from_path("m/1852'/1815'/0'/0/0")
    payment_skey = PaymentSigningKey.from_primitive(payment_key.xprivate_key[:32])
    payment_vkey = PaymentVerificationKey.from_signing_key(payment_skey)
    address = Address(payment_vkey.hash(), network=_get_network())
    return payment_skey, payment_vkey, address

def load_policy_key():
    hdwallet = _get_hdwallet()
    policy_key = hdwallet.derive_from_path("m/1852'/1815'/0'/2/0")
    policy_skey = PaymentSigningKey.from_primitive(policy_key.xprivate_key[:32])
    policy_vkey = PaymentVerificationKey.from_signing_key(policy_skey)
    policy_script = ScriptAll([ScriptPubkey(policy_vkey.hash())])
    policy_id = policy_script.hash()
    return policy_skey, policy_vkey, policy_script, policy_id

def get_address():
    _, _, address = load_wallet()
    return str(address)

def get_utxos(address_str):
    context = init_context()
    return context.utxos(address_str)

def query_asset(policy_id, asset_name_hex):
    asset_id = f"{policy_id}{asset_name_hex}"
    url = f"{get_blockfrost_url()}/v0/assets/{asset_id}"
    headers = {"project_id": BLOCKFROST_PROJECT_ID}
    response = requests.get(url, headers=headers, timeout=30)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return None
    else:
        response.raise_for_status()

def query_asset_by_policy(policy_id):
    url = f"{get_blockfrost_url()}/v0/assets/policy/{policy_id}"
    headers = {"project_id": BLOCKFROST_PROJECT_ID}
    response = requests.get(url, headers=headers, timeout=30)
    if response.status_code == 200:
        return response.json()
    elif response.status_code == 404:
        return []
    else:
        response.raise_for_status()

def get_asset_metadata(policy_id, asset_name_hex):
    asset = query_asset(policy_id, asset_name_hex)
    if asset and "onchain_metadata" in asset:
        return asset["onchain_metadata"]
    return None

def check_connection():
    try:
        url = f"{get_blockfrost_url()}/v0/health"
        headers = {"project_id": BLOCKFROST_PROJECT_ID}
        response = requests.get(url, headers=headers, timeout=10)
        return response.status_code == 200
    except Exception:
        return False
