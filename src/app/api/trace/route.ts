import { NextRequest, NextResponse } from 'next/server';
import { inspectTransaction } from '@/lib/tracer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash } = body;

    if (!txHash) {
      return NextResponse.json(
        { error: 'Missing transaction hash parameter (txHash)' },
        { status: 400 }
      );
    }

    const rpcUrl = process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life';
    const report = await inspectTransaction(txHash, rpcUrl);

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Error in /api/trace:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error while inspecting transaction' },
      { status: 500 }
    );
  }
}

