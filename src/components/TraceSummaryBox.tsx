'use client';

import React from 'react';
import { TraceReport } from '@/lib/tracer';
import { Terminal, Copy, Check } from 'lucide-react';

interface Props {
  report: TraceReport;
}

export function TraceSummaryBox({ report }: Props) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(report.summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-5 shadow-none">
      <div className="mb-3 flex items-center justify-between border-b border-slate-700 pb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">
            Formatted Trace Result
          </h2>
        </div>
        <button
          onClick={copy}
          className="flex items-center space-x-1 rounded bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:text-white border border-slate-700 transition"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copied ? 'Copied' : 'Copy Output'}</span>
        </button>
      </div>

      <pre className="overflow-x-auto rounded bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-200 border border-slate-800 whitespace-pre">
        {report.summaryText}
      </pre>
    </div>
  );
}

