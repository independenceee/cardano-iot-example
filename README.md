# Cardano IoT Examples

A collection of IoT projects demonstrating Cardano blockchain integration for real-world applications.

## Projects Overview

| Project | Hardware | Stack | Use Case |
|---------|----------|-------|----------|
| **IoT1** | Raspberry Pi 5 + DHT22 | TypeScript + Python | Sensor data logging to blockchain |
| **IoT2** | N/A (backend) | Aiken + TypeScript | Smart contract lock/unlock state |
| **IoT3** | ESP32C3 | C++ (PlatformIO) | Payment notification system |
| **IoT4** | Raspberry Pi 5 + PN532 NFC | TypeScript + Python | NFC identity verification |
| **IoT5** | Raspberry Pi 5 + Camera/Scanner | TypeScript + Python | QR code supply chain traceability |

## Video Demos

| Project | Video |
|---------|-------|
| **IoT1** - DHT22 Sensor Data Store | [Watch Demo](https://youtu.be/khH-3ZzBanU) |
| **IoT2** - Smart Contract Lock/Unlock | [Watch Demo](https://youtu.be/8k02ehV1r7Q) |
| **IoT3** - Vending Machine Payment | [Watch Demo](https://youtu.be/L75_IOXbAu0) |
| **IoT4** - NFC Tag Identity Verification | [Watch Demo](https://youtu.be/79a9eahkA5k) |
| **IoT5** - QR Code Supply Chain Traceability | [Watch Demo](https://youtu.be/h_saOa3uWoo) |

---

## IoT1 - DHT22 Sensor Data Store

Real-time temperature and humidity monitoring with immutable blockchain storage.

### Hardware Requirements

- Raspberry Pi 5 (or any Pi with GPIO)
- DHT22 sensor (AM2302)
- 3 jumper wires (VCC 3.3V, Data GPIO4, GND)
- Internet connection

### Technology Stack

- **Runtime:** Node.js with TypeScript (tsx)
- **Sensor:** Python (Adafruit CircuitPython DHT)
- **Blockchain:** Mesh SDK + Blockfrost API

### Quick Start

```bash
cd iot1-sensor-data-store

# Install dependencies
npm install
sudo pip3 install rpi-lgpio adafruit-circuitpython-dht --break-system-packages

# Configure
cp .env.example .env
# Edit .env with your Blockfrost API key and wallet mnemonic

# Run
npm start              # Continuous monitoring
npm run write         # Write to blockchain (every 2 min)
npm run monitor       # Read blockchain data
npm test              # Quick sensor test
```

### Features

- Real-time DHT22 sensor reading via GPIO pin 4
- Auto retry mechanism (5 retries, 2s delays)
- Blockchain submission every 2 minutes
- Historical data querying from Cardano

---

## IoT2 - Smart Contract Lock/Unlock State

Manages IoT device states on-chain with role-based access control using Aiken smart contracts.

### Technology Stack

- **Smart Contracts:** Aiken (Plutus v3)
- **Off-Chain:** TypeScript (Bun runtime)
- **Blockchain:** Cardano preprod testnet

### Smart Contract Architecture

```aiken
pub type Datum {
  authority: Address,
  is_locked: Int        // 0 = unlocked, 1 = locked
}

pub type Redeemer {
  Status                // Toggle lock (owner OR authority)
  Authorize             // Transfer authority (owner only)
}
```

**Validators:**
- `locker.mint` - Owner-only minting policy for status tokens
- `locker.spend` - State transition validator with RBAC

### Quick Start

```bash
cd iot2-sync-state-onchain

# Build smart contracts
aiken build
aiken check            # Run tests

# Install off-chain dependencies
bun install

# Configure
cp .env.example .env
# Edit .env with Blockfrost API key and wallet mnemonic

# Run
bun run index.ts       # Execute unlock/lock
bun run monitor.ts     # Monitor locker status
```

### Features

- Role-based access control (owner vs authority)
- UTXO-based state tracking with status tokens
- Authority transfer capabilities
- Real-time state monitoring

---

## IoT3 - Vending Machine Payment Notification

Real-time Cardano wallet UTXO monitor on ESP32C3 that triggers PUMP notification proportional to ADA received.

### Hardware Requirements

- **Board:** Seeed Studio XIAO ESP32C3
- **PUMP:** External relay/pump + 220Ω resistor
- **Connection:** GPIO3 (D10) → 220Ω → PUMP+ → GND
- **Cable:** USB-C for programming
- **Network:** 2.4GHz WiFi

### Technology Stack

- **Embedded:** C++ with Arduino Framework
- **Build Tool:** PlatformIO
- **API:** Blockfrost REST (HTTPS)
- **JSON:** ArduinoJson v7.0.0

### Quick Start

```bash
cd iot3-vending-machines

# Configure WiFi and API key
# Edit include/config.h

# Build & Upload (CLI)
pio run --target upload
pio device monitor     # Serial monitor (115200 baud)

# Or use VS Code + PlatformIO extension
```

### Configuration (include/config.h)

```cpp
#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"
#define BLOCKFROST_API_KEY "preprod..."
#define WALLET_ADDRESS "addr_test1q..."
#define POLL_INTERVAL_MS 10000        // 10 seconds
#define PUMP_MS_PER_ADA 1000          // 1 ADA = 1 second
#define PUMP_MAX_DURATION_MS 60000    // Max 60 seconds
```

### Features

- WiFi-connected wallet monitoring (preprod testnet)
- Real-time UTXO detection (polls every 10s)
- Non-blocking PUMP control
- PUMP duration proportional to ADA (1 ADA = 1s, max 60s)
- Memory efficient (~100KB free heap)

### PUMP Behavior

| ADA Received | PUMP Duration |
|--------------|---------------|
| 0.5 ADA      | 0.5 seconds   |
| 10 ADA       | 10 seconds    |
| 100 ADA      | 60 seconds (capped) |

---

## IoT4 - NFC Tag Identity Verification

Decentralized identity verification using NFC tags linked to Cardano blockchain credentials.

### Hardware Requirements

- **Board:** Raspberry Pi 5 (or Pi 4)
- **NFC Reader:** PN532 NFC/RFID module (I2C/SPI)
- **Display:** 7-inch Raspberry Pi Touch Display (optional)
- **Connection:** I2C (SDA→GPIO2, SCL→GPIO3) or SPI
- **Network:** WiFi/Ethernet

### Technology Stack

- **Runtime:** Node.js with TypeScript
- **NFC Library:** Python (nfcpy or pn532-i2c)
- **Blockchain:** Aiken smart contracts + Mesh SDK
- **Identity:** CIP-68 NFT metadata for credentials

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  NFC Tag    │────▶│  PN532      │────▶│  Raspberry Pi   │
│  (UID)      │     │  Reader     │     │  + Cardano Node │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │  Cardano        │
                                        │  Blockchain     │
                                        │  (Verify NFT)   │
                                        └─────────────────┘
```

### Smart Contract Design

```aiken
pub type CredentialDatum {
  holder: VerificationKeyHash,
  nfc_uid: ByteArray,
  credential_type: ByteArray,
  issued_at: Int,
  expires_at: Int,
  issuer: VerificationKeyHash,
}

pub type Redeemer {
  Verify
  Revoke
  Renew
}
```

### Planned Features

- NFC tag UID reading via PN532
- Credential NFT lookup on Cardano (CIP-68)
- Real-time verification status display
- Issuer/revocation authority management
- Expiration date validation
- Audit log on blockchain

### Use Cases

- Student ID verification
- Employee access cards
- Event ticket validation
- Membership verification

---

## IoT5 - QR Code Supply Chain Traceability

Product tracking and authenticity verification using QR codes with blockchain-backed provenance.

### Hardware Requirements

- **Board:** Raspberry Pi 5 (or Pi 4)
- **Scanner:** USB barcode/QR scanner (GM65) or Pi Camera
- **Display:** 7-inch Raspberry Pi Touch Display
- **Printer:** Thermal label printer (optional, for QR generation)
- **Network:** WiFi/Ethernet

### Technology Stack

- **Runtime:** Node.js with TypeScript
- **QR Library:** Python (pyzbar, opencv) or zbar
- **Blockchain:** Aiken smart contracts + Mesh SDK
- **Metadata:** CIP-68 for dynamic product data updates

### Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  QR Code    │────▶│  Scanner/   │────▶│  Raspberry Pi   │
│  (Product)  │     │  Camera     │     │  + Web UI       │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │  Cardano        │
                                        │  Blockchain     │
                                        │  (CIP-68 NFT)   │
                                        └─────────────────┘
```

### Smart Contract Design

```aiken
pub type ProductDatum {
  product_id: ByteArray,
  manufacturer: VerificationKeyHash,
  batch_number: ByteArray,
  production_date: Int,
  current_location: ByteArray,
  status: ProductStatus,
  checkpoints: List<Checkpoint>,
}

pub type ProductStatus {
  Manufactured
  InTransit
  Delivered
  Sold
}

pub type Checkpoint {
  location: ByteArray,
  timestamp: Int,
  handler: VerificationKeyHash,
}

pub type Redeemer {
  UpdateLocation { new_location: ByteArray }
  TransferOwnership { new_owner: VerificationKeyHash }
  MarkDelivered
}
```

### Planned Features

- QR code scanning and decoding
- Product NFT lookup on Cardano
- Supply chain checkpoint recording
- Location and timestamp tracking
- Ownership transfer management
- Counterfeit detection (verify on-chain record)
- Mobile-friendly web UI for verification

### Use Cases

- Food origin traceability
- Pharmaceutical supply chain
- Luxury goods authentication
- Electronics warranty tracking

---

## Common Setup

### Blockfrost API Key

All projects require a Blockfrost API key:
1. Register at [blockfrost.io](https://blockfrost.io)
2. Create a project for Cardano preprod testnet
3. Copy the API key to your configuration

### Wallet Setup

IoT1 and IoT2 require a Cardano wallet mnemonic:
1. Create a wallet (e.g., via Mesh SDK or Nami)
2. Fund with test ADA from [Cardano Faucet](https://docs.cardano.org/cardano-testnets/tools/faucet)
3. Add mnemonic to `.env` file

---

## Project Structure

```
cardano-iot-example/
├── iot1-sensor-data-store/      # Raspberry Pi + DHT22
│   ├── main.ts                  # Continuous monitoring
│   ├── dht22.py                 # Python GPIO interface
│   ├── action/                  # Blockchain handlers
│   └── scripts/                 # Mesh SDK utilities
├── iot2-sync-state-onchain/      # Aiken smart contracts
│   ├── validators/contract.ak   # Lock/unlock validator
│   ├── script/                  # Off-chain TypeScript
│   └── plutus.json             # Compiled contracts
├── iot3-vending-machines/       # ESP32C3 payment notification
│   ├── include/                 # C++ headers
│   ├── src/                     # C++ implementation
│   └── platformio.ini          # Build configuration
├── iot4-nfc-tag-identification/ # NFC identity verification
│   ├── validators/              # Aiken smart contracts
│   ├── scripts/                 # TypeScript off-chain
│   └── nfc/                     # Python NFC interface
└── iot5-qr-code-traceability/   # QR supply chain tracking
    ├── validators/              # Aiken smart contracts
    ├── scripts/                 # TypeScript off-chain
    └── scanner/                 # Python QR scanner
```

---

## Security Notes

- **Development Mode:** Projects use `setInsecure()` for SSL (skips cert validation)
- **Credentials:** Never commit `.env` files or `config.h` with real credentials
- **Production:** Embed proper CA certificates and use secure credential storage

### Securing the Wallet Mnemonic on Physical Devices

Storing the mnemonic directly in a plain `.env` or `config.h` file is convenient for
development, but it is a significant risk if the physical device (Raspberry Pi or ESP32)
is lost, stolen, or otherwise compromised. For any real-world deployment, treat the
mnemonic as a high-value secret and consider the following:

- **Hardware Security Modules (HSM) / Secure Elements:** Store the seed inside a dedicated
  secure element (e.g. ATECC608, YubiHSM, TPM 2.0) so the private key material never leaves
  the chip and cannot be extracted from the device filesystem.
- **Encrypt local secret files:** If a file-based secret is unavoidable, encrypt it at rest
  (e.g. `age`, `sops`, or an OS keyring) and decrypt only in memory at runtime instead of
  keeping the plaintext mnemonic on disk.
- **Least privilege:** Use a dedicated hot wallet holding only the minimal funds required
  for the device's operation, and keep the treasury/master keys offline.
- **Rotate on compromise:** If a device is exposed, move funds and rotate the mnemonic
  immediately.

> **Note on scope:** This repository is intended for **educational and research purposes**.
> The examples are deliberately kept as simple as possible so that developers can quickly
> get familiar with the eUTxO architecture and stand up a working prototype. In a real
> production system, the secret-management and security measures above should be implemented
> in far more detail.

## License

MIT
