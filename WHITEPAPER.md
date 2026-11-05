# BOTTxTrace Whitepaper
### Decentralized Transaction Execution Tracing, Internal Call Verification, and Provenance Protocol on Botchain

**Document Version:** 1.0.0  
**Target Network:** Bohr Testnet (Chain ID: 968)  
**Contract Address:** `0xbc193929a0754bc658db7881357ff007351cab57`  
**Explorer:** [https://scan.bohr.life/](https://scan.bohr.life/)  
**Native Currency:** BOT  

---

## Abstract

As the Ethereum Virtual Machine (EVM) ecosystem expands into modular and specialized layer-1/layer-2 networks such as Botchain (Bohr), smart contract execution complexity has increased exponentially. Modern on-chain transactions routinely trigger deeply nested sequences of internal contract-to-contract interactions—including multi-hop asset routing, flash-liquidity operations, access-control delegations (`DELEGATECALL`), and dynamic contract instantiations (`CREATE`/`CREATE2`).

Standard blockchain JSON-RPC consensus receipts (`eth_getTransactionReceipt`) expose only the top-level outcome, cumulative gas consumed, and emitted event logs. They remain completely opaque regarding internal call hierarchies, individual frame gas consumption, and hidden internal reverts. Conversely, full EVM debug tracers (`debug_traceTransaction`) require significant computational overhead, archive node storage, and are frequently disabled or restricted on production public RPC endpoints.

**BOTTxTrace** resolves this dichotomy by introducing an open-source, deterministic transaction tracing architecture and on-chain inspection registry tailored specifically for Botchain Testnet (Chain ID 968). The protocol provides:
1. **On-Chain Trace Request & Verification Provenance** via `BOTTxTrace.sol`, enabling smart contracts and auditors to permanently record trace requests and publish cryptographic report hashes on-chain.
2. **Dual-Mode Inspection Engine** that parses granular `callTracer` trees when available, with a rigorous **Anti-Fabrication Fallback** mechanism that accurately presents verified receipt consensus metrics without inventing mock internal calls when node trace APIs are restricted.
3. **Calldata & Revert Reason Decoding**, translating raw EVM calldata and panic codes (`0x4e487b71` and `0x08c379a0`) into human-readable diagnostics.

---

## 1. Introduction

Transaction transparency is the core tenet of decentralized ledgers. However, the EVM execution model divides execution into:
- **Top-Level Transactions**: Initiated by an Externally Owned Account (EOA) or smart contract account via a signed envelope containing `to`, `value`, `gasLimit`, `gasPrice`/`maxFeePerGas`, `nonce`, and `data`.
- **Internal Transactions (Message Calls)**: Initiated during contract execution via EVM opcodes (`CALL`, `STATICCALL`, `DELEGATECALL`, `CALLCODE`, `CREATE`, `CREATE2`).

Because internal transactions are state transitions executed in ephemeral memory frames during VM runtime, they are not recorded directly on the blockchain state trie. Unless an archive or trace node captures the opcode execution history using custom VM hooks, internal interactions remain invisible to standard explorers and client applications.

On emerging networks like Botchain, developers, auditors, and security investigators need robust tools to inspect transaction behavior, diagnose failed calls, verify fund flow routing, and establish verifiable audit trails without relying on opaque, proprietary SaaS indexing platforms.

---

## 2. Problem Statement & Design Objectives

### 2.1 The Opaque Receipt Problem
Standard consensus receipts provide a binary status (`0x1` for Success, `0x0` for Reverted). If a complex contract executes 10 internal sub-calls and the 9th call reverts inside a `try/catch` block or silently consumes excessive gas, the final receipt may still declare `SUCCESS`. Standard block explorers fail to illustrate which contract swallowed the error or where tokens were diverted.

### 2.2 The Threat of Trace Fabrication
When RPC nodes disable tracing methods (such as `debug_traceTransaction` or `trace_transaction`), certain client tools synthesize or "hallucinate" plausible internal calls based on heuristics or transfer logs. This practice introduces grave security risks, as synthetic traces can mislead auditors during exploit investigations or incident triage.

### 2.3 Lack of On-Chain Trace Provenance
Off-chain trace analyses conducted by developers lack immutability. There is no decentralized mechanism on Botchain to register an investigation request and publish an immutable cryptographic attestation of the execution report on-chain.

### 2.4 Design Objectives
- **Strict Integrity**: Zero fabrication of internal calls. If the underlying RPC does not support opcode tracing, the system explicitly declares the limitation and restricts analysis to verified receipt data.
- **On-Chain Audit Trail**: Provide a canonical smart contract (`BOTTxTrace.sol`) on Bohr Testnet allowing any entity to register trace requests and record audit report hashes.
- **Zero-Gradient, High-Legibility Developer Interface**: Eliminate glossy gradients, glassmorphism, and low-contrast visuals in favor of clear, flat, developer-grade UI elements.

---

## 3. Protocol Architecture

The BOTTxTrace system consists of three coordinated layers:

```
+-----------------------------------------------------------------------+
|                            USER INTERFACE                             |
|       (Next.js App, Flat UI, Reown AppKit, Viem / Wagmi 2.x)          |
+-----------------------------------------------------------------------+
                                    |
                  +-----------------+-----------------+
                  |                                   |
                  v                                   v
+-----------------------------------+   +-------------------------------+
|     OFF-CHAIN TRACING ENGINE      |   |      ON-CHAIN REGISTRY        |
|          (src/lib/tracer.ts)      |   |        (BOTTxTrace.sol)       |
|  - eth_getTransactionByHash       |   |  - requestTransactionTrace()  |
|  - eth_getTransactionReceipt      |   |  - getRequest()               |
|  - debug_traceTransaction         |   |  - publishResult()            |
|  - Revert & Calldata Decoder      |   |  Deployed at:                 |
|  - Strict Anti-Fabrication Engine |   |  0xbc193929a075...cab57       |
+-----------------------------------+   +-------------------------------+
                  |                                   |
                  +-----------------+-----------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                   BOTCHAIN TESTNET (CHAIN ID: 968)                    |
|                        RPC: https://rpc.bohr.life                     |
|                      Explorer: https://scan.bohr.life                 |
+-----------------------------------------------------------------------+
```

### 3.1 On-Chain Layer: `BOTTxTrace.sol`
Deployed at address `0xbc193929a0754bc658db7881357ff007351cab57` on Bohr Testnet. It serves as an immutable registry for trace requests and published cryptographic reports.

### 3.2 Verification & Tracing Engine (`src/lib/tracer.ts`)
An execution inspector that queries the Bohr RPC, orchestrates consensus verification, handles trace method detection, recursively unpacks call trees, and translates revert bytes into readable diagnostics.

### 3.3 Application & Security Layer
Built on Next.js 14, Wagmi 2.x, Viem, and Reown AppKit. Sensitive environment variables (`REOWN_ID` and `PRIVATE_KEY`) are isolated strictly on the server-side, preventing exposure in public client-side JavaScript bundles.

---

## 4. Smart Contract Specification: `BOTTxTrace.sol`

### 4.1 Data Structures

```solidity
struct TraceRequest {
    bytes32 requestId;
    bytes32 transactionHash;
    address requester;
    uint256 timestamp;
    bytes32 reportHash;
    bool fulfilled;
}
```

- `requestId`: Unique 32-byte pseudo-random hash calculated as:
  $$\text{requestId} = \text{keccak256}(\text{abi.encodePacked}(\text{transactionHash}, \text{msg.sender}, \text{block.timestamp}, \text{nonce}))$$
- `transactionHash`: Target 32-byte hash of the transaction to inspect.
- `requester`: Account that initiated the request.
- `timestamp`: Block timestamp at which the request was recorded.
- `reportHash`: Cryptographic hash (e.g. Keccak-256 or IPFS multihash) of the verified trace diagnostic report.
- `fulfilled`: Boolean flag indicating whether the report has been submitted.

### 4.2 Core Methods

#### `requestTransactionTrace(bytes32 transactionHash)`
```solidity
function requestTransactionTrace(bytes32 transactionHash) external returns (bytes32 requestId);
```
- **Preconditions**: `transactionHash != bytes32(0)`.
- **Effects**: Increments internal `_nonce`, generates `requestId`, creates `TraceRequest` storage entry with `fulfilled = false`, pushes `requestId` to `_allRequestIds`, and emits `TraceRequested(requestId, transactionHash, msg.sender, block.timestamp)`.
- **Returns**: `requestId`.

#### `getRequest(bytes32 requestId)`
```solidity
function getRequest(bytes32 requestId) external view returns (TraceRequest memory);
```
- **Preconditions**: Request must exist (`requester != address(0)`).
- **Returns**: Stored `TraceRequest` struct.

#### `publishResult(bytes32 requestId, bytes32 reportHash)`
```solidity
function publishResult(bytes32 requestId, bytes32 reportHash) external;
```
- **Preconditions**: Request must exist; `reportHash != bytes32(0)`.
- **Effects**: Updates `requests[requestId].reportHash = reportHash`, sets `requests[requestId].fulfilled = true`, and emits `ResultPublished(requestId, reportHash, msg.sender, block.timestamp)`.

#### `totalRequests()` & `getRecentRequests(uint256 limit)`
```solidity
function totalRequests() external view returns (uint256);
function getRecentRequests(uint256 limit) external view returns (bytes32[] memory);
```
- Utility queries for indexing, pagination, and dashboard displays.

---

## 5. Tracing Engine & Anti-Fabrication Logic

### 5.1 Dual-Phase Inspection Protocol

1. **Phase 1: Consensus Verification**
   - Dispatches parallel JSON-RPC requests: `eth_getTransactionByHash` and `eth_getTransactionReceipt`.
   - Extracts consensus parameters:
     - Top-level status ($\text{receipt.status} \in \{0, 1\}$)
     - Block number and block hash
     - Originating sender (`from`) and target recipient (`to`)
     - Contract deployment address (`receipt.contractAddress`)
     - Gas limit vs. gas consumed ($G_{\text{used}} / G_{\text{limit}}$)
     - Effective gas price ($P_{\text{eff}}$ in Gwei)
     - Transaction envelope type (Legacy `0x0`, EIP-2930 `0x1`, EIP-1559 `0x2`)

2. **Phase 2: Execution Tracing Query**
   - Dispatches `debug_traceTransaction(txHash, { tracer: 'callTracer', tracerConfig: { onlyTopCall: false } })`.
   - **Case A: Method Supported**:
     - Recursively parses tree nodes:
       - Determines `depth` ($d \in [0, \dots, N]$).
       - Extracts call type ($T \in \{\text{CALL}, \text{STATICCALL}, \text{DELEGATECALL}, \text{CREATE}, \text{CREATE2}\}$).
       - Profiles frame gas allocated and gas consumed.
       - Identifies reverted child frames.
   - **Case B: Method Unsupported (RPC Code `-32601`)**:
     - Intercepts error `the method debug_traceTransaction does not exist/is not available`.
     - Flags `traceSupported = false`.
     - Injects explicit diagnostic banner:
       > *"RPC debug_traceTransaction unavailable: Method not supported on Bohr Testnet RPC. Displaying receipt analysis. Internal calls are omitted without invention."*
     - Evaluates failed internal calls count to $0$ and outputs only verified top-level consensus boundaries.

### 5.2 Calldata & Revert Decoding Engine

- **Function Selector Matching**: Extracts the first 4 bytes of calldata ($\text{calldata}[0:4]$) and cross-references against known interface catalogs:
  - Standard ERC-20 (`0xa9059cbb` `transfer`, `0x095ea7b3` `approve`, `0x23b872dd` `transferFrom`, etc.)
  - Standard ERC-721 / ERC-1155
  - Uniswap / Router Swaps (`0x38ed1739`, `0x7ff36ab5`, `0x18cbafe5`)
  - BOTTxTrace Protocol (`0x35639e31` `requestTransactionTrace`, `0x8797b5d8` `getRequest`, `0x5734be34` `publishResult`)
- **Revert Reason Extraction**:
  - `0x08c379a0`: `Error(string)` — decodes ABI parameter string.
  - `0x4e487b71`: `Panic(uint256)` — decodes arithmetic underflow/overflow, division by zero, array out-of-bounds, and assertion failures.

---

## 6. Output Standardization

Every transaction inspection produces both a programmatic data structure (`TraceReport`) and a standardized ASCII execution summary:

```text
TRANSACTION TRACE

Transaction: 0x0b74...39eb
Status: SUCCESS
Gas Used: 400,880

Execution Calls:

1. Top-level: 0x55da...ec16 -> Contract Deployment (0xbc19...ab57)

[Limitation Note: Internal call tracing is unavailable on Bohr Testnet RPC. Receipt analysis only.]
Failed Internal Calls: 0

Status: Basic Receipt Analysis (Tracing Unavailable)
```

When tracing methods are active, the `Execution Calls` block displays the complete nested hierarchy:
```text
TRANSACTION TRACE

Transaction: 0x1234...abcd
Status: SUCCESS
Gas Used: 120,000

Execution Calls:

1. 0xabcd...1234 -> 0x5678...cdef (CALL)
2. 0x5678...cdef -> 0x9876...fedc (DELEGATECALL)
3. 0x9876...fedc -> 0x3456...789a (STATICCALL)

Failed Internal Calls: 0

Status: Trace Complete
```

---

## 7. Security & Key Management

1. **Zero Client Secret Leakage**:
   - The Reown Project ID is bound as `REOWN_ID` on the server-side (`process.env.REOWN_ID`), never exposed as `VITE_REOWN_ID` or static client bundles.
   - Private keys used for deployment (`PRIVATE_KEY`) reside exclusively in `.env`, which is strictly excluded from version control via `.gitignore`.
2. **Safe RPC Intermediation**:
   - Browser clients route inspection queries through the local Next.js `/api/trace` and `/api/config` endpoints, eliminating browser CORS limitations and preventing origin poisoning.
3. **Smart Contract Immutability**:
   - `BOTTxTrace.sol` does not contain upgradeability proxies or owner backdoors. All submitted requests are permanent and immutable.

---

## 8. Network Deployment Parameters

| Parameter | Value |
| :--- | :--- |
| **Network Name** | Bohr Testnet (Botchain) |
| **Chain ID** | `968` |
| **RPC URL** | `https://rpc.bohr.life` |
| **Native Token** | BOT (18 Decimals) |
| **Block Explorer** | `https://scan.bohr.life` |
| **Contract Address** | `0xbc193929a0754bc658db7881357ff007351cab57` |
| **Solidity Compiler** | `0.8.20` (Optimizer: 200 runs) |
| **Deployment Transaction** | `0x0b74d5bd94bd55ac91ae89cfe1c6290c29400cf5ace7fe4f4ed5abb5058239eb` |

---

## 9. Future Roadmap

1. **Decentralized Oracles for Archive Tracing**: Introduce cryptographic attestations from dedicated trace nodes that sign EVM opcode traces for Botchain.
2. **ZK-Trace Proofs**: Generate zero-knowledge validity proofs for internal state transitions without requiring full nodes to re-execute debug traces.
3. **Token Balance Delta Graphing**: Automated parsing of ERC-20, ERC-721, and native balance variations across all intermediate contract calls.

---

## 10. Conclusion

BOTTxTrace bridges the critical visibility gap between top-level EVM receipts and complex internal smart contract interactions on Botchain Testnet. By combining an immutable on-chain tracking registry (`BOTTxTrace.sol`) with a strict, anti-fabrication execution analysis engine and flat developer-first interface, BOTTxTrace provides developers, auditors, and security researchers with a trustworthy diagnostic and provenance platform.

---
*Published by the BOTTxTrace Protocol Contributors.*
