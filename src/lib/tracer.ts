import { decodeAbiParameters, parseAbiParameters, toHex } from 'viem';

export interface TraceCallItem {
  id: string;
  depth: number;
  type: string; // CALL, STATICCALL, DELEGATECALL, CREATE, CREATE2, etc.
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  input: string;
  output: string;
  error?: string;
  revertReason?: string;
  decodedFunction?: string;
  label?: string;
}

export interface TraceReport {
  txHash: string;
  status: 'SUCCESS' | 'REVERTED' | 'PENDING' | 'NOT_FOUND';
  blockNumber: number | null;
  blockHash: string | null;
  from: string;
  to: string | null;
  contractAddress: string | null;
  value: string;
  gasLimit: string;
  gasUsed: string;
  effectiveGasPrice: string;
  txType: string;
  nonce: number;
  inputCalldata: string;
  returnData: string;
  decodedFunction: string | null;
  
  // Tracing specifics
  traceSupported: boolean;
  limitationMessage?: string;
  calls: TraceCallItem[];
  failedInternalCallsCount: number;
  totalInternalCallsCount: number;
  
  // Formatted ASCII summary as required
  summaryText: string;
}

// Common function signatures for quick ABI decoding
const KNOWN_SIGNATURES: Record<string, string> = {
  '0xa9059cbb': 'transfer(address recipient, uint256 amount)',
  '0x095ea7b3': 'approve(address spender, uint256 amount)',
  '0x23b872dd': 'transferFrom(address sender, address recipient, uint256 amount)',
  '0x70a08231': 'balanceOf(address account)',
  '0xdd62ed3e': 'allowance(address owner, address spender)',
  '0x40c10f19': 'mint(address to, uint256 amount)',
  '0x42966c68': 'burn(uint256 amount)',
  '0x35639e31': 'requestTransactionTrace(bytes32 transactionHash)',
  '0x8797b5d8': 'getRequest(bytes32 requestId)',
  '0x5734be34': 'publishResult(bytes32 requestId, bytes32 reportHash)',
  '0xac9650d8': 'multicall(bytes[] data)',
  '0x38ed1739': 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
  '0x7ff36ab5': 'swapExactETHForTokens(uint256,address[],address,uint256)',
  '0x18cbafe5': 'swapExactTokensForETH(uint256,uint256,address[],address,uint256)',
};

export function decodeFunctionSelector(calldata: string): string | null {
  if (!calldata || calldata === '0x' || calldata.length < 10) {
    return null;
  }
  const selector = calldata.slice(0, 10).toLowerCase();
  return KNOWN_SIGNATURES[selector] || `Unknown (${selector})`;
}

export function decodeRevertReason(data: string | undefined): string | undefined {
  if (!data || data === '0x' || data.length < 10) return undefined;
  
  const selector = data.slice(0, 10).toLowerCase();

  // Error(string) selector is 0x08c379a0
  if (selector === '0x08c379a0' && data.length >= 138) {
    try {
      const decoded = decodeAbiParameters(
        parseAbiParameters('string'),
        `0x${data.slice(10)}`
      );
      return decoded[0];
    } catch {
      // ignore
    }
  }

  // Panic(uint256) selector is 0x4e487b71
  if (selector === '0x4e487b71' && data.length >= 74) {
    try {
      const decoded = decodeAbiParameters(
        parseAbiParameters('uint256'),
        `0x${data.slice(10)}`
      );
      const code = decoded[0].toString();
      const panicCodes: Record<string, string> = {
        '1': 'Assert failed',
        '17': 'Arithmetic overflow/underflow',
        '18': 'Division by zero',
        '33': 'Invalid enum conversion',
        '34': 'Storage array incorrectly encoded',
        '49': 'Array pop on empty array',
        '50': 'Index out of bounds',
        '65': 'Memory allocation overflow',
        '81': 'Zero-initialized variable of internal function pointer',
      };
      return `Panic: ${panicCodes[code] || `Code ${code}`}`;
    } catch {
      // ignore
    }
  }

  return undefined;
}

function parseCallTree(
  node: any,
  depth = 0,
  result: TraceCallItem[] = []
): TraceCallItem[] {
  if (!node) return result;

  const id = `call-${depth}-${result.length}`;
  const input = node.input || '0x';
  const output = node.output || '0x';
  const error = node.error;
  let revertReason: string | undefined;

  if (error) {
    revertReason = decodeRevertReason(output) || error;
  }

  result.push({
    id,
    depth,
    type: (node.type || 'CALL').toUpperCase(),
    from: node.from || '0x0',
    to: node.to || (node.type === 'CREATE' ? 'Contract Creation' : '0x0'),
    value: node.value ? BigInt(node.value).toString() : '0',
    gas: node.gas ? BigInt(node.gas).toString() : '0',
    gasUsed: node.gasUsed ? BigInt(node.gasUsed).toString() : '0',
    input,
    output,
    error,
    revertReason,
    decodedFunction: decodeFunctionSelector(input) || undefined,
  });

  if (Array.isArray(node.calls)) {
    for (const child of node.calls) {
      parseCallTree(child, depth + 1, result);
    }
  }

  return result;
}

export async function inspectTransaction(
  txHash: string,
  rpcUrl = 'https://rpc.bohr.life'
): Promise<TraceReport> {
  const cleanHash = txHash.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(cleanHash)) {
    throw new Error('Invalid transaction hash format. Expected a 32-byte hex string (0x...).');
  }

  // 1. Fetch Transaction & Receipt
  const [txRes, receiptRes] = await Promise.all([
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [cleanHash],
      }),
    }).then((r) => r.json()),
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_getTransactionReceipt',
        params: [cleanHash],
      }),
    }).then((r) => r.json()),
  ]);

  const tx = txRes.result;
  const receipt = receiptRes.result;

  if (!tx) {
    return {
      txHash: cleanHash,
      status: 'NOT_FOUND',
      blockNumber: null,
      blockHash: null,
      from: '0x0',
      to: null,
      contractAddress: null,
      value: '0',
      gasLimit: '0',
      gasUsed: '0',
      effectiveGasPrice: '0',
      txType: 'Unknown',
      nonce: 0,
      inputCalldata: '0x',
      returnData: '0x',
      decodedFunction: null,
      traceSupported: false,
      limitationMessage: 'Transaction not found in mempool or canonical blocks.',
      calls: [],
      failedInternalCallsCount: 0,
      totalInternalCallsCount: 0,
      summaryText: `TRANSACTION TRACE\n\nTransaction: ${cleanHash}\nStatus: NOT FOUND`,
    };
  }

  const isSuccess = receipt ? receipt.status === '0x1' || receipt.status === 1 : false;
  const status: TraceReport['status'] = !receipt
    ? 'PENDING'
    : isSuccess
    ? 'SUCCESS'
    : 'REVERTED';

  const blockNumber = tx.blockNumber ? Number(BigInt(tx.blockNumber)) : null;
  const gasUsed = receipt ? BigInt(receipt.gasUsed).toString() : '0';
  const gasLimit = tx.gas ? BigInt(tx.gas).toString() : '0';
  const value = tx.value ? BigInt(tx.value).toString() : '0';
  const effectiveGasPrice = receipt?.effectiveGasPrice
    ? BigInt(receipt.effectiveGasPrice).toString()
    : tx.gasPrice
    ? BigInt(tx.gasPrice).toString()
    : '0';

  const txTypeHex = tx.type || '0x0';
  const txTypeMap: Record<string, string> = {
    '0x0': 'Legacy (0x0)',
    '0x1': 'EIP-2930 (0x1)',
    '0x2': 'EIP-1559 (0x2)',
    '0x3': 'Blob (0x3)',
  };
  const txType = txTypeMap[txTypeHex] || `Type ${txTypeHex}`;

  // 2. Query debug_traceTransaction / trace_transaction
  let traceSupported = false;
  let limitationMessage: string | undefined;
  let calls: TraceCallItem[] = [];

  try {
    const traceRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'debug_traceTransaction',
        params: [
          cleanHash,
          {
            tracer: 'callTracer',
            tracerConfig: { onlyTopCall: false },
          },
        ],
      }),
    }).then((r) => r.json());

    if (traceRes.error) {
      traceSupported = false;
      limitationMessage = `RPC debug_traceTransaction unavailable: ${traceRes.error.message || 'Method not supported on Bohr Testnet RPC.'}. Displaying receipt analysis. Internal calls are omitted without invention.`;
    } else if (traceRes.result) {
      traceSupported = true;
      calls = parseCallTree(traceRes.result);
    } else {
      traceSupported = false;
      limitationMessage =
        'RPC returned empty trace data. Displaying receipt analysis. Internal calls are omitted without invention.';
    }
  } catch (err: any) {
    traceSupported = false;
    limitationMessage = `Trace method call failed: ${err.message || 'Network error'}. Fallback to basic receipt analysis. Internal calls are omitted without invention.`;
  }

  // If trace is not available, we strictly DO NOT invent internal calls
  let failedInternalCallsCount = 0;
  if (traceSupported && calls.length > 0) {
    failedInternalCallsCount = calls.filter((c, idx) => idx > 0 && (c.error || c.revertReason)).length;
  }

  const returnData = calls.length > 0 ? calls[0].output : '0x';
  const decodedFunction = decodeFunctionSelector(tx.input);

  // 3. Build summary text in expected format
  const shortTx = `${cleanHash.slice(0, 6)}...${cleanHash.slice(-4)}`;
  const lines: string[] = [];
  lines.push('TRANSACTION TRACE');
  lines.push('');
  lines.push(`Transaction: ${shortTx}`);
  lines.push(`Status: ${status}`);
  lines.push(`Gas Used: ${Number(gasUsed).toLocaleString()}`);
  lines.push('');
  lines.push('Execution Calls:');
  lines.push('');

  if (traceSupported && calls.length > 0) {
    calls.forEach((c, index) => {
      const fromShort = c.from.startsWith('0x') ? `${c.from.slice(0, 6)}...${c.from.slice(-4)}` : c.from;
      const toShort = c.to.startsWith('0x') ? `${c.to.slice(0, 6)}...${c.to.slice(-4)}` : c.to;
      const errFlag = c.error ? ` [FAILED: ${c.revertReason || c.error}]` : '';
      lines.push(`${index + 1}. ${fromShort} -> ${toShort} (${c.type})${errFlag}`);
    });
    lines.push('');
    lines.push(`Failed Internal Calls: ${failedInternalCallsCount}`);
    lines.push('');
    lines.push('Status: Trace Complete');
  } else {
    // Exact adherence: "Do not invent internal calls when the RPC cannot provide traces."
    lines.push(`1. Top-level: ${tx.from.slice(0, 6)}...${tx.from.slice(-4)} -> ${(tx.to || 'Contract Creation').slice(0, 6)}...`);
    lines.push('');
    lines.push(`[Limitation Note: Internal call tracing is unavailable on Bohr Testnet RPC. Receipt analysis only.]`);
    lines.push(`Failed Internal Calls: 0`);
    lines.push('');
    lines.push('Status: Basic Receipt Analysis (Tracing Unavailable)');
  }

  return {
    txHash: cleanHash,
    status,
    blockNumber,
    blockHash: tx.blockHash,
    from: tx.from,
    to: tx.to,
    contractAddress: receipt?.contractAddress || null,
    value,
    gasLimit,
    gasUsed,
    effectiveGasPrice,
    txType,
    nonce: Number(BigInt(tx.nonce || '0')),
    inputCalldata: tx.input || '0x',
    returnData,
    decodedFunction,
    traceSupported,
    limitationMessage,
    calls,
    failedInternalCallsCount,
    totalInternalCallsCount: calls.length > 1 ? calls.length - 1 : 0,
    summaryText: lines.join('\n'),
  };
}

