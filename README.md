# BOTTxTrace - Bohr Testnet Transaction Tracer

A transaction tracing, internal call inspection, and on-chain verification platform built for **Botchain Testnet (Chain ID 968)**.

---

## Network Specifications

- **Network Name**: Bohr Testnet (Botchain Testnet)
- **Chain ID**: `968`
- **RPC Endpoint**: `https://rpc.bohr.life`
- **Native Token**: `BOT`
- **Block Explorer**: [https://scan.bohr.life/](https://scan.bohr.life/)

---

## Features

### 1. Execution Overview
- Transaction Status (`SUCCESS`, `REVERTED`, `PENDING`, `NOT_FOUND`)
- Sender Address (`from`)
- Recipient / Contract Creation Address (`to` / `contractAddress`)
- Value Transferred in `BOT`
- Gas Consumption vs. Gas Limit and Percentage Used
- Block Number with direct link to BohrScan
- Transaction Type (`Legacy (0x0)`, `EIP-2930 (0x1)`, `EIP-1559 (0x2)`)

### 2. Execution Trace
- Internal contract-to-contract call tree with visual indentation
- Call depth hierarchy (`Depth 0`, `Depth 1`, ...)
- Call types (`CALL`, `STATICCALL`, `DELEGATECALL`, `CREATE`, `CREATE2`)
- Gas consumption per individual internal call frame
- Reverted calls detection and decoded revert reason strings / panic codes
- **Trace Provider Limitation Handling**:
  - Automatically queries `debug_traceTransaction` / `trace_transaction` on Bohr Testnet RPC.
  - If the RPC provider does not support or expose internal trace methods, displays a clear limitation alert and provides basic receipt consensus analysis instead.
  - **Does not invent or mock internal calls** when the RPC cannot provide traces.

### 3. Raw Data & ABI Decoding
- Input calldata with byte size and copy utility
- Return data / output inspection
- Decoded function selector matching (ERC20, ERC721, standard routers, and BOTTxTrace)

### 4. Smart Contract: `BOTTxTrace.sol`
Deployed on Bohr Testnet to record inspection requests and published verification hashes.
- `requestTransactionTrace(bytes32 transactionHash)`: Submits a transaction hash and records the request on-chain.
- `getRequest(bytes32 requestId)`: Queries the recorded request status, requester, timestamp, and published report hash.
- `publishResult(bytes32 requestId, bytes32 reportHash)`: Publishes the verification/report hash to fulfill a request.

### 5. UI Design
- Flat, normal neutral colors (Slate & Zinc).
- **No glossy effects, no backdrop blurs, no color gradients** as specified.
- High contrast, developer-oriented, accessible layout.

---

## Configuration (`.env`)

Add your configuration to `.env`:

```env
# Botchain Testnet Configuration
BOTCHAIN_RPC="https://rpc.bohr.life"
BOTCHAIN_CHAIN_ID=968
BOTCHAIN_EXPLORER="https://scan.bohr.life"

# Reown AppKit Project ID (Server-side REOWN_ID, not public in Vite bundle)
REOWN_ID=your_reown_project_id_here

# Private Key for deploying BOTTxTrace.sol to Botchain Testnet
PRIVATE_KEY=your_private_key_here

# Deployed Contract Address (auto-populated upon deployment)
BOT_TX_TRACE_ADDRESS=
```

---

## Getting Started

### 1. Compile Smart Contract
```bash
npm run compile:contract
```

### 2. Deploy Smart Contract to Botchain Testnet
Ensure your deployer address has `BOT` testnet tokens from Bohr Testnet, then run:
```bash
npm run deploy:contract
```
*(You can also click the "Deploy BOTTxTrace.sol" button directly inside the web interface if `PRIVATE_KEY` is in `.env`)*

### 3. Start the Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

