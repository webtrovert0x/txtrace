'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { keccak256, toHex, stringToHex } from 'viem';
import { BOT_TX_TRACE_ABI } from '@/config/contract';
import { useAppConfig } from '@/context/AppKitProvider';
import { ShieldCheck, Send, Search, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  currentTxHash: string;
}

export function ContractInteraction({ currentTxHash }: Props) {
  const { contractAddress } = useAppConfig();
  const { address, isConnected } = useAccount();

  // On-chain trace submission state
  const [targetTx, setTargetTx] = useState(currentTxHash);
  const [requestHashSubmitted, setRequestHashSubmitted] = useState<string | null>(null);

  // Inspection by Request ID state
  const [lookupRequestId, setLookupRequestId] = useState('');
  const [queriedRequestId, setQueriedRequestId] = useState<`0x${string}` | undefined>(undefined);

  // Publish state
  const [publishReqId, setPublishReqId] = useState('');
  const [publishHash, setPublishHash] = useState('');

  // Wagmi Write hook
  const { writeContractAsync, isPending } = useWriteContract();

  // Update targetTx when parent currentTxHash changes
  React.useEffect(() => {
    if (currentTxHash) setTargetTx(currentTxHash);
  }, [currentTxHash]);

  // Read single request
  const { data: requestDetails, refetch: refetchRequest } = useReadContract({
    address: (contractAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
    abi: BOT_TX_TRACE_ABI,
    functionName: 'getRequest',
    args: queriedRequestId ? [queriedRequestId] : undefined,
    query: {
      enabled: Boolean(contractAddress && queriedRequestId && queriedRequestId.length === 66),
    },
  });

  const handleRequestTrace = async () => {
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      alert('BOTTxTrace contract is not yet deployed. Please deploy it first.');
      return;
    }
    if (!targetTx || !/^0x[0-9a-fA-F]{64}$/.test(targetTx.trim())) {
      alert('Please enter a valid 32-byte transaction hash (0x + 64 hex chars).');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: BOT_TX_TRACE_ABI,
        functionName: 'requestTransactionTrace',
        args: [targetTx.trim() as `0x${string}`],
      });
      setRequestHashSubmitted(hash);
      alert(`Trace requested on Botchain Testnet! Tx Hash: ${hash}`);
    } catch (err: any) {
      alert(`Error submitting request: ${err.message || err}`);
    }
  };

  const handleLookupRequest = () => {
    const clean = lookupRequestId.trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(clean)) {
      alert('Please enter a valid 32-byte Request ID (0x + 64 hex chars).');
      return;
    }
    setQueriedRequestId(clean as `0x${string}`);
  };

  const handlePublishResult = async () => {
    if (!contractAddress) return;
    const reqId = publishReqId.trim();
    const repHash = publishHash.trim() || keccak256(stringToHex(`BOTTxTrace-Report-${Date.now()}`));

    if (!/^0x[0-9a-fA-F]{64}$/.test(reqId)) {
      alert('Please enter a valid 32-byte Request ID.');
      return;
    }

    try {
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: BOT_TX_TRACE_ABI,
        functionName: 'publishResult',
        args: [reqId as `0x${string}`, repHash as `0x${string}`],
      });
      alert(`Report published on Botchain Testnet! Tx: ${hash}`);
      if (queriedRequestId === reqId) {
        refetchRequest();
      }
    } catch (err: any) {
      alert(`Error publishing result: ${err.message || err}`);
    }
  };

  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-5 shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-blue-400" />
            <span>Smart Contract: BOTTxTrace.sol</span>
          </h2>
          <p className="text-xs text-slate-400">
            On-chain inspection registry and report publishing on Bohr Testnet (Chain ID 968)
          </p>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          {contractAddress ? (
            <span className="text-emerald-400">Active: {contractAddress.slice(0, 8)}...</span>
          ) : (
            <span className="text-yellow-400">Not Deployed</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 text-xs">
        {/* Action 1: requestTransactionTrace */}
        <div className="rounded border border-slate-700 bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="font-semibold text-slate-200 mb-1">
              1. requestTransactionTrace()
            </div>
            <p className="text-slate-400 mb-3">
              Record transaction hash and inspection request permanently on-chain.
            </p>
            <label className="block text-slate-400 mb-1 font-medium">
              Transaction Hash:
            </label>
            <input
              type="text"
              value={targetTx}
              onChange={(e) => setTargetTx(e.target.value)}
              placeholder="0x..."
              className="w-full rounded bg-slate-950 px-2.5 py-1.5 font-mono text-slate-200 border border-slate-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleRequestTrace}
              disabled={isPending || !isConnected}
              className="w-full flex items-center justify-center space-x-1.5 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-3 py-2 font-medium text-white transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isPending ? 'Submitting...' : 'Record Request On-Chain'}</span>
            </button>
            {!isConnected && (
              <p className="mt-1 text-[11px] text-yellow-500 text-center">
                Connect wallet to submit on-chain
              </p>
            )}
            {requestHashSubmitted && (
              <p className="mt-2 text-[11px] font-mono text-emerald-400 break-all">
                Submitted Tx: {requestHashSubmitted}
              </p>
            )}
          </div>
        </div>

        {/* Action 2: getRequest */}
        <div className="rounded border border-slate-700 bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="font-semibold text-slate-200 mb-1">
              2. getRequest(requestId)
            </div>
            <p className="text-slate-400 mb-3">
              Query on-chain record for requester, timestamp, and published result hash.
            </p>
            <label className="block text-slate-400 mb-1 font-medium">
              Request ID:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={lookupRequestId}
                onChange={(e) => setLookupRequestId(e.target.value)}
                placeholder="0x..."
                className="w-full rounded bg-slate-950 px-2.5 py-1.5 font-mono text-slate-200 border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={handleLookupRequest}
                className="rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-medium text-slate-200 border border-slate-600"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            {requestDetails ? (
              <div className="rounded bg-slate-950 p-2.5 border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={requestDetails.fulfilled ? 'text-emerald-400' : 'text-amber-400'}>
                    {requestDetails.fulfilled ? 'FULFILLED' : 'PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Requester:</span>{' '}
                  <span className="text-slate-300">{requestDetails.requester.slice(0, 6)}...{requestDetails.requester.slice(-4)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Tx:</span>{' '}
                  <span className="text-slate-300">{requestDetails.transactionHash.slice(0, 10)}...</span>
                </div>
                <div>
                  <span className="text-slate-500">Report Hash:</span>{' '}
                  <span className="text-blue-400">{requestDetails.reportHash.slice(0, 10)}...</span>
                </div>
              </div>
            ) : (
              <div className="rounded bg-slate-950 p-2 text-slate-500 text-center italic">
                Enter requestId to read state
              </div>
            )}
          </div>
        </div>

        {/* Action 3: publishResult */}
        <div className="rounded border border-slate-700 bg-slate-900 p-4 flex flex-col justify-between">
          <div>
            <div className="font-semibold text-slate-200 mb-1">
              3. publishResult(requestId, reportHash)
            </div>
            <p className="text-slate-400 mb-3">
              Fulfill trace request with cryptographic execution report hash.
            </p>
            <div className="space-y-2">
              <div>
                <label className="block text-slate-400 mb-1 font-medium text-[11px]">
                  Request ID:
                </label>
                <input
                  type="text"
                  value={publishReqId}
                  onChange={(e) => setPublishReqId(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded bg-slate-950 px-2.5 py-1 font-mono text-slate-200 border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium text-[11px]">
                  Report Hash (or auto-hash):
                </label>
                <input
                  type="text"
                  value={publishHash}
                  onChange={(e) => setPublishHash(e.target.value)}
                  placeholder="0x... (leave blank to auto-hash)"
                  className="w-full rounded bg-slate-950 px-2.5 py-1 font-mono text-slate-200 border border-slate-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={handlePublishResult}
              disabled={isPending || !isConnected}
              className="w-full flex items-center justify-center space-x-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 px-3 py-2 font-medium text-slate-200 border border-slate-600 transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Publish Result Hash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

