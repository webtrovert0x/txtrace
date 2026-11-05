import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bohrTestnet } from '@/config/chains';

export async function POST() {
  try {
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'PRIVATE_KEY is not defined in .env. Please add it to your .env file.' },
        { status: 400 }
      );
    }

    const formattedKey = (privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`) as `0x${string}`;
    const account = privateKeyToAccount(formattedKey);

    const artifactPath = path.resolve(process.cwd(), 'src/config/BOTTxTrace.json');
    if (!fs.existsSync(artifactPath)) {
      return NextResponse.json(
        { error: 'Compiled contract artifact not found. Please compile first.' },
        { status: 500 }
      );
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    const rpcUrl = process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life';
    const publicClient = createPublicClient({
      chain: bohrTestnet,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: bohrTestnet,
      transport: http(rpcUrl),
    });

    const balance = await publicClient.getBalance({ address: account.address });

    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: `0x${artifact.bytecode}`,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const contractAddress = receipt.contractAddress;

    // Save to deployed.json
    const deployedPath = path.resolve(process.cwd(), 'src/config/deployed.json');
    fs.writeFileSync(
      deployedPath,
      JSON.stringify(
        {
          chainId: 968,
          address: contractAddress,
          deployer: account.address,
          txHash: hash,
          blockNumber: receipt.blockNumber.toString(),
          deployedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    // Update .env
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('BOT_TX_TRACE_ADDRESS=')) {
      envContent = envContent.replace(
        /BOT_TX_TRACE_ADDRESS=.*/,
        `BOT_TX_TRACE_ADDRESS=${contractAddress}`
      );
    } else {
      envContent += `\nBOT_TX_TRACE_ADDRESS=${contractAddress}\n`;
    }
    fs.writeFileSync(envPath, envContent);

    return NextResponse.json({
      success: true,
      contractAddress,
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      deployer: account.address,
      balance: (Number(balance) / 1e18).toString(),
    });
  } catch (err: any) {
    console.error('Contract deployment failed:', err);
    return NextResponse.json(
      { error: err.message || 'Deployment failed' },
      { status: 500 }
    );
  }
}

