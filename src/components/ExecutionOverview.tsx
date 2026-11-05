'use client';

import React from 'react';
import { TraceReport } from '@/lib/tracer';
import { CheckCircle2, XCircle, Clock, ExternalLink, Copy, Check } from 'lucide-react';

interface Props {
  report: TraceReport;
}

export function ExecutionOverview({ report }: Props) {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatBotValue = (weiStr: string) => {
    try {
      const val = BigInt(weiStr);
      const bot = Number(val) / 1e18;
      return `${bot.toFixed(6)} BOT`;
    } catch {
      return `${weiStr} wei`;
    }
  };

  const getStatusBadge = () => {
    switch (report.status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded bg-emerald-950 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>SUCCESS</span>
          </span>
        );
      case 'REVERTED':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded bg-red-950 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-800">
            <XCircle className="h-3.5 w-3.5" />
            <span>REVERTED</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center space-x-1.5 rounded bg-amber-950 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-800">
            <Clock className="h-3.5 w-3.5" />
            <span>PENDING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-700">
            <span>NOT FOUND</span>
          </span>
        );
    }
  };

  const gasPercentage =
    report.gasLimit && BigInt(report.gasLimit) > BigInt(0)
      ? ((Number(report.gasUsed) / Number(report.gasLimit)) * 100).toFixed(1)
      : '0';

  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-5 shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Execution Overview
          </h2>
          <p className="text-xs text-slate-400">
            Top-level consensus & execution verification on Botchain Testnet
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge()}
          <span className="rounded bg-slate-900 px-2 py-1 font-mono text-xs text-slate-300 border border-slate-700">
            {report.txType}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 text-xs">
        {/* Transaction Hash */}
        <div className="sm:col-span-2 lg:col-span-3 rounded bg-slate-900 p-2.5 border border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Tx Hash:</span>
            <span className="font-mono text-slate-200 break-all">{report.txHash}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(report.txHash, 'tx')}
              className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
              title="Copy Tx Hash"
            >
              {copiedField === 'tx' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
            <a
              href={`https://scan.bohr.life/tx/${report.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View in BohrScan</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Sender */}
        <div className="rounded bg-slate-900 p-2.5 border border-slate-700">
          <div className="text-slate-400 font-medium mb-1">Sender (From)</div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-200 break-all">{report.from}</span>
            <button
              onClick={() => copyToClipboard(report.from, 'from')}
              className="text-slate-400 hover:text-slate-200 ml-2"
            >
              {copiedField === 'from' ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>

        {/* Recipient */}
        <div className="rounded bg-slate-900 p-2.5 border border-slate-700">
          <div className="text-slate-400 font-medium mb-1">
            {report.contractAddress ? 'Contract Created' : 'Recipient (To)'}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-slate-200 break-all">
              {report.to || report.contractAddress || 'Contract Deployment'}
            </span>
            {(report.to || report.contractAddress) && (
              <button
                onClick={() =>
                  copyToClipboard(
                    report.to || report.contractAddress || '',
                    'to'
                  )
                }
                className="text-slate-400 hover:text-slate-200 ml-2"
              >
                {copiedField === 'to' ? (
                  <Check className="h-3 w-3 text-emerald-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Value Transferred */}
        <div className="rounded bg-slate-900 p-2.5 border border-slate-700">
          <div className="text-slate-400 font-medium mb-1">Value Transferred</div>
          <div className="font-mono text-emerald-400 font-semibold text-sm">
            {formatBotValue(report.value)}
          </div>
        </div>

        {/* Gas Used */}
        <div className="rounded bg-slate-900 p-2.5 border border-slate-700">
          <div className="text-slate-400 font-medium mb-1">Gas Used</div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-slate-200">
              {Number(report.gasUsed).toLocaleString()}
            </span>
            <span className="text-slate-400 text-xs">
              ({gasPercentage}% of {Number(report.gasLimit).toLocaleString()} limit)
            </span>
          </div>
        </div>

        {/* Block Number */}
        <div className="rounded bg-slate-900 p-2.5 border border-slate-700">
          <div className="text-slate-400 font-medium mb-1">Block Number</div>
          <div className="font-mono text-slate-200">
            {report.blockNumber !== null ? (
              <a
                href={`https://scan.bohr.life/block/${report.blockNumber}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline"
              >
                #{report.blockNumber}
              </a>
            ) : (
              'Pending'
            )}
          </div>
        </div>

        {/* Effective Gas Price */}
        <div className="rounded bg-slate-900 p-2.5 border border-slate-700">
          <div className="text-slate-400 font-medium mb-1">Effective Gas Price</div>
          <div className="font-mono text-slate-200">
            {(Number(report.effectiveGasPrice) / 1e9).toFixed(2)} Gwei
          </div>
        </div>
      </div>
    </div>
  );
}
