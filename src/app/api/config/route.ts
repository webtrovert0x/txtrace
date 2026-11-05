import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  let contractAddress = process.env.BOT_TX_TRACE_ADDRESS || '';

  // Check if deployed.json exists as fallback
  if (!contractAddress) {
    try {
      const deployedPath = path.resolve(process.cwd(), 'src/config/deployed.json');
      if (fs.existsSync(deployedPath)) {
        const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));
        contractAddress = deployed.address || '';
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    reownId: process.env.REOWN_ID || '',
    contractAddress,
    chainId: Number(process.env.BOTCHAIN_CHAIN_ID || 968),
    rpc: process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life',
    explorer: process.env.BOTCHAIN_EXPLORER || 'https://scan.bohr.life',
    hasPrivateKey: Boolean(process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length > 10),
  });
}

