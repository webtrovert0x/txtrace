'use client';

import React, { useState, useEffect } from 'react';
import { useAppConfig, getGlobalAppKit } from '@/context/AppKitProvider';
import { useAccount, useDisconnect } from 'wagmi';
import { ExternalLink, Wallet, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export function Header() {
  const { reownId, contractAddress, hasPrivateKey, refreshConfig } = useAppConfig();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openAppKit = () => {
    try {
      const modal = getGlobalAppKit();
      if (modal && typeof modal.open === 'function') {
        modal.open();
      } else {
        alert('AppKit modal is initializing or REOWN_ID is missing in .env.');
      }
    } catch (e: any) {
      console.warn('Could not open modal:', e);
    }
  };

  const handleDeployContract = async () => {
    if (!hasPrivateKey) {
      alert('Please add PRIVATE_KEY to your .env file to deploy the contract.');
      return;
    }
    setDeploying(true);
    setDeployMsg(null);
    try {
      const res = await fetch('/api/deploy', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deployment failed');
      setDeployMsg(`Deployed at: ${data.contractAddress}`);
      await refreshConfig();
    } catch (err: any) {
      setDeployMsg(`Error: ${err.message}`);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <header className="border-b border-slate-700 bg-slate-900 px-6 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        {/* Brand & Network */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-600 font-mono text-sm font-bold text-white">
              BOT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-100">BOTTxTrace</h1>
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-blue-400 border border-slate-700">
                  Chain 968
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Botchain Testnet Transaction Tracer
              </p>
            </div>
          </div>
        </div>

        {/* Network Specs Bar */}
        <div className="hidden lg:flex items-center space-x-6 text-xs text-slate-300">
          <div>
            <span className="text-slate-500">RPC:</span>{' '}
            <span className="font-mono text-slate-200">rpc.bohr.life</span>
          </div>
          <div>
            <span className="text-slate-500">Native:</span>{' '}
            <span className="font-mono text-emerald-400">BOT</span>
          </div>
          <div>
            <a
              href="https://scan.bohr.life"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
            >
              <span>Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Actions & Wallet */}
        <div className="flex items-center space-x-3">
          {/* Smart Contract Status / Deploy */}
          {contractAddress ? (
            <div className="hidden sm:flex items-center space-x-1 rounded bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 border border-slate-700">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-slate-400">Contract:</span>
              <a
                href={`https://scan.bohr.life/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-blue-400 hover:underline"
              >
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </a>
            </div>
          ) : (
            <button
              onClick={handleDeployContract}
              disabled={deploying}
              className="flex items-center space-x-1.5 rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-600 transition"
              title="Deploys BOTTxTrace.sol to Botchain Testnet using PRIVATE_KEY from .env"
            >
              <Shield className="h-3.5 w-3.5 text-yellow-400" />
              <span>{deploying ? 'Deploying...' : 'Deploy BOTTxTrace.sol'}</span>
            </button>
          )}

          {/* Wallet Connect */}
          {mounted && reownId ? (
            isConnected ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openAppKit}
                  className="flex items-center space-x-2 rounded bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-mono text-slate-200 border border-slate-600"
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                </button>
                <button
                  onClick={() => disconnect()}
                  className="rounded bg-slate-800 hover:bg-red-900/40 px-2.5 py-1.5 text-xs text-slate-400 hover:text-red-300 border border-slate-700"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={openAppKit}
                className="flex items-center space-x-2 rounded bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-medium text-white transition"
              >
                <Wallet className="h-3.5 w-3.5" />
                <span>Connect Wallet</span>
              </button>
            )
          ) : (
            <div className="flex items-center space-x-1.5 rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-400 border border-slate-700">
              <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />
              <span>Set REOWN_ID in .env for wallet</span>
            </div>
          )}
        </div>
      </div>

      {deployMsg && (
        <div className="mx-auto mt-2 max-w-7xl rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-300 border border-slate-700">
          {deployMsg}
        </div>
      )}
    </header>
  );
}
