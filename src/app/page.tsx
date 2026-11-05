'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { AppKitProvider } from '@/context/AppKitProvider';
import { Header } from '@/components/Header';
import { ExecutionOverview } from '@/components/ExecutionOverview';
import { ExecutionTrace } from '@/components/ExecutionTrace';
import { RawDataViewer } from '@/components/RawDataViewer';
import { TraceSummaryBox } from '@/components/TraceSummaryBox';
import { ContractInteraction } from '@/components/ContractInteraction';
import { TraceReport } from '@/lib/tracer';
import { Search, Loader2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const [txHash, setTxHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TraceReport | null>(null);

  const handleTrace = async (hashToTrace?: string) => {
    const target = (hashToTrace || txHash).trim();
    if (!target) {
      setError('Please provide a transaction hash.');
      return;
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(target)) {
      setError('Invalid hash format. Must be a 32-byte hex string (0x followed by 64 hex characters).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: target }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inspect transaction');
      }

      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred while tracing transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTrace();
    }
  };

  return (
    <AppKitProvider>
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
        <Header />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Main Search / Trace Input */}
        <div className="rounded border border-slate-700 bg-slate-800 p-6 mb-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-100">
              Botchain Testnet Transaction Inspector
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Verify consensus receipts, internal contract execution calls, and calldata on Bohr Testnet (Chain ID 968).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Botchain Testnet Transaction Hash (0x...)"
                className="w-full rounded bg-slate-900 px-4 py-2.5 font-mono text-xs text-slate-100 placeholder-slate-500 border border-slate-700 focus:border-blue-500 focus:outline-none"
              />
              {txHash && (
                <button
                  onClick={() => setTxHash('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => handleTrace()}
              disabled={loading}
              className="flex items-center justify-center space-x-2 rounded bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 px-6 py-2.5 text-xs font-semibold text-white transition flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Tracing...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Trace Transaction</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Sample Button */}
          <div className="mt-3 flex items-center space-x-2 text-[11px] text-slate-400">
            <span>Sample live tx:</span>
            <button
              onClick={() => {
                setTxHash('0x0b74d5bd94bd55ac91ae89cfe1c6290c29400cf5ace7fe4f4ed5abb5058239eb');
                handleTrace('0x0b74d5bd94bd55ac91ae89cfe1c6290c29400cf5ace7fe4f4ed5abb5058239eb');
              }}
              className="font-mono text-blue-400 hover:text-blue-300 underline"
            >
              0x0b74d5bd94bd55ac91ae89cfe1c6290c29400cf5ace7fe4f4ed5abb5058239eb
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center space-x-2 rounded bg-red-950/60 p-3 text-xs text-red-300 border border-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Sections */}
        {report && (
          <div className="space-y-6">
            {/* 1. Execution Overview */}
            <ExecutionOverview report={report} />

            {/* 2. Execution Trace */}
            <ExecutionTrace report={report} />

            {/* 3. Raw Data Viewer */}
            <RawDataViewer report={report} />

            {/* 4. Formatted Summary (Required expected result format) */}
            <TraceSummaryBox report={report} />

            {/* 5. Smart Contract Interaction (BOTTxTrace.sol) */}
            <ContractInteraction currentTxHash={report.txHash} />
          </div>
        )}

        {!report && !loading && (
          <div className="rounded border border-slate-800 bg-slate-850 p-12 text-center text-slate-500">
            <Search className="mx-auto h-8 w-8 text-slate-600 mb-3" />
            <p className="text-sm text-slate-400 font-medium">
              Ready to inspect transactions
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Enter any 32-byte transaction hash from Botchain Testnet (Chain ID 968) and click{' '}
              <strong className="text-slate-300">Trace Transaction</strong> to view execution traces and internal contract calls.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-900 py-4 text-center text-xs text-slate-500">
        BOTTxTrace &bull; Bohr Testnet (Chain ID 968) &bull; RPC: https://rpc.bohr.life &bull; Explorer: https://scan.bohr.life
      </footer>
    </div>
    </AppKitProvider>
  );
}
