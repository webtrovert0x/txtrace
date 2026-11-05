export const BOT_TX_TRACE_ABI = [
  {
    type: 'function',
    name: 'requestTransactionTrace',
    inputs: [{ name: 'transactionHash', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: 'requestId', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getRequest',
    inputs: [{ name: 'requestId', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct BOTTxTrace.TraceRequest',
        components: [
          { name: 'requestId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'transactionHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'requester', type: 'address', internalType: 'address' },
          { name: 'timestamp', type: 'uint256', internalType: 'uint256' },
          { name: 'reportHash', type: 'bytes32', internalType: 'bytes32' },
          { name: 'fulfilled', type: 'bool', internalType: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'publishResult',
    inputs: [
      { name: 'requestId', type: 'bytes32', internalType: 'bytes32' },
      { name: 'reportHash', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'totalRequests',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRecentRequests',
    inputs: [{ name: 'limit', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'bytes32[]', internalType: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'TraceRequested',
    inputs: [
      { name: 'requestId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'transactionHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'requester', type: 'address', indexed: true, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'ResultPublished',
    inputs: [
      { name: 'requestId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'reportHash', type: 'bytes32', indexed: true, internalType: 'bytes32' },
      { name: 'publisher', type: 'address', indexed: true, internalType: 'address' },
      { name: 'timestamp', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

export const DEFAULT_BOT_TX_TRACE_ADDRESS =
  (process.env.BOT_TX_TRACE_ADDRESS as `0x${string}`) || '0x0000000000000000000000000000000000000000';

