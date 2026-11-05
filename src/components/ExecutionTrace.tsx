'use client';

import React from 'react';
import { TraceReport, TraceCallItem } from '@/lib/tracer';
import { AlertTriangle, ArrowRight, CornerDownRight, CheckCircle2, XCircle, Info } from 'lucide-react';

interface Props {
  report: TraceReport;
}

export function ExecutionTrace({ report }: Props) {
  const getCallTypeBadge = (type: string) => {
    switch (type) {
      case 'CALL':
        return (
          <span className="rounded bg-blue-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-300 border border-blue-800">
            CALL
          </span>
        );
      case 'STATICCALL':
        return (
          <span className="rounded bg-purple-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-purple-300 border border-purple-800">
            STATICCALL
          </span>
        );
      case 'DELEGATECALL':
        return (
          <span className="rounded bg-amber-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 border border-amber-800">
            DELEGATECALL
          </span>
        );
      case 'CREATE':
      case 'CREATE2':
        return (
          <span className="rounded bg-emerald-950 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-300 border border-emerald-800">
            {type}
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-300 border border-slate-700">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-5 shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Execution Trace
          </h2>
          <p className="text-xs text-slate-400">
            Internal contract calls, call depth, and frame execution breakdown
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="rounded bg-slate-900 px-2.5 py-1 text-slate-300 border border-slate-700">
            Total Internal Calls: <strong className="text-white">{report.totalInternalCallsCount}</strong>
          </span>
          <span
            className={`rounded px-2.5 py-1 border ${
              report.failedInternalCallsCount > 0
                ? 'bg-red-950 text-red-300 border-red-800'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            Failed Internal Calls: <strong>{report.failedInternalCallsCount}</strong>
          </span>
        </div>
      </div>

      {/* Tracing Limitation Notice */}
      {!report.traceSupported && (
        <div className="mb-4 rounded border border-amber-800/80 bg-amber-950/40 p-4 text-xs text-amber-200">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-400 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-300">
                Trace Provider Limitation Notice
              </div>
              <p className="mt-1 text-amber-200/90 leading-relaxed">
                {report.limitationMessage ||
                  'The Bohr Testnet RPC (https://rpc.bohr.life) does not expose debug_traceTransaction or callTracer. Basic receipt analysis is provided above. As per security specification, internal calls are not fabricated or invented.'}
              </p>
              <div className="mt-2 text-slate-400">
                Top-level execution status has been validated via consensus receipt logs on Bohr Testnet.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calls List / Tree */}
      {report.calls.length > 0 ? (
        <div className="space-y-2">
          {report.calls.map((call, idx) => {
            const isReverted = Boolean(call.error || call.revertReason);
            const indentPixels = Math.min(call.depth * 24, 120);

            return (
              <div
                key={call.id || idx}
                style={{ marginLeft: `${indentPixels}px` }}
                className={`rounded border p-3 text-xs transition ${
                  isReverted
                    ? 'border-red-800 bg-red-950/30'
                    : 'border-slate-700 bg-slate-900'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    {call.depth > 0 && (
                      <CornerDownRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                    )}
                    <span className="font-mono text-slate-500 font-semibold">
                      #{idx + 1}
                    </span>
                    {getCallTypeBadge(call.type)}
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      Depth {call.depth}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-slate-400">
                    {call.gasUsed && (
                      <span className="font-mono">
                        Gas: <strong className="text-slate-200">{Number(call.gasUsed).toLocaleString()}</strong>
                      </span>
                    )}
                    {isReverted ? (
                      <span className="flex items-center space-x-1 text-red-400 font-medium">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Reverted</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Success</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Call Flow */}
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-slate-300">
                  <span className="break-all text-slate-400">
                    {call.from}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                  <span className="break-all font-semibold text-slate-200">
                    {call.to}
                  </span>
                </div>

                {/* Decoded function */}
                {call.decodedFunction && (
                  <div className="mt-2 rounded bg-slate-800 px-2 py-1 font-mono text-[11px] text-blue-300 border border-slate-700">
                    Function: {call.decodedFunction}
                  </div>
                )}

                {/* Revert Reason */}
                {call.revertReason && (
                  <div className="mt-2 rounded bg-red-950 px-2 py-1 font-mono text-[11px] text-red-300 border border-red-800">
                    Revert Reason: {call.revertReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded border border-slate-700 bg-slate-900 p-6 text-center text-xs text-slate-400">
          <Info className="mx-auto h-5 w-5 text-slate-500 mb-2" />
          <p>No internal execution frames were provided by the RPC.</p>
          <p className="mt-1 text-slate-500">
            Top-level contract interaction status is available in the Overview panel.
          </p>
        </div>
      )}
    </div>
  );
}

