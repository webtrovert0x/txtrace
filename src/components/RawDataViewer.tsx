'use client';

import React from 'react';
import { TraceReport } from '@/lib/tracer';
import { Copy, Check, Code, FileText } from 'lucide-react';

interface Props {
  report: TraceReport;
}

export function RawDataViewer({ report }: Props) {
  const [copiedSection, setCopiedSection] = React.useState<string | null>(null);

  const copy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="rounded border border-slate-700 bg-slate-800 p-5 shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <Code className="h-4 w-4 text-blue-400" />
            <span>Raw Data & ABI Decoding</span>
          </h2>
          <p className="text-xs text-slate-400">
            Hexadecimal calldata, return values, and matched function selectors
          </p>
        </div>
      </div>

      <div className="space-y-4 text-xs">
        {/* Decoded Function Name */}
        <div>
          <div className="text-slate-400 font-medium mb-1.5 flex items-center justify-between">
            <span>Decoded Function Method</span>
            {report.inputCalldata.length >= 10 && (
              <span className="font-mono text-slate-500">
                Selector: {report.inputCalldata.slice(0, 10)}
              </span>
            )}
          </div>
          <div className="rounded bg-slate-900 p-2.5 font-mono border border-slate-700 text-slate-200">
            {report.decodedFunction ? (
              <span className="text-emerald-400 font-semibold">
                {report.decodedFunction}
              </span>
            ) : report.inputCalldata === '0x' ? (
              <span className="text-slate-500 italic">
                None (Native BOT transfer / empty calldata)
              </span>
            ) : (
              <span className="text-yellow-400">
                Unrecognized Selector ({report.inputCalldata.slice(0, 10)})
              </span>
            )}
          </div>
        </div>

        {/* Input Calldata */}
        <div>
          <div className="text-slate-400 font-medium mb-1.5 flex items-center justify-between">
            <span>Input Calldata ({Math.max(0, (report.inputCalldata.length - 2) / 2)} bytes)</span>
            <button
              onClick={() => copy(report.inputCalldata, 'input')}
              className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              {copiedSection === 'input' ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>Copy</span>
            </button>
          </div>
          <pre className="max-h-36 overflow-auto rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-300 border border-slate-700 whitespace-pre-wrap break-all">
            {report.inputCalldata || '0x'}
          </pre>
        </div>

        {/* Return Data */}
        <div>
          <div className="text-slate-400 font-medium mb-1.5 flex items-center justify-between">
            <span>Return Data / Output ({Math.max(0, (report.returnData.length - 2) / 2)} bytes)</span>
            <button
              onClick={() => copy(report.returnData, 'output')}
              className="text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              {copiedSection === 'output' ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span>Copy</span>
            </button>
          </div>
          <pre className="max-h-36 overflow-auto rounded bg-slate-900 p-2.5 font-mono text-[11px] text-slate-300 border border-slate-700 whitespace-pre-wrap break-all">
            {report.returnData || '0x'}
          </pre>
        </div>
      </div>
    </div>
  );
}

