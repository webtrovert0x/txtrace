require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { defineChain } = require('viem');

const bohrTestnet = defineChain({
  id: 968,
  name: 'Bohr Testnet',
  nativeCurrency: {
    name: 'BOT',
    symbol: 'BOT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BohrScan',
      url: process.env.BOTCHAIN_EXPLORER || 'https://scan.bohr.life',
    },
  },
});

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY not found in .env.');
    console.error('Please add your PRIVATE_KEY (with or without 0x prefix) to .env before deploying.');
    process.exit(1);
  }

  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey);

  console.log(`Deployer Address: ${account.address}`);
  console.log(`Target Network: Bohr Testnet (Chain ID 968)`);
  console.log(`RPC Endpoint: ${process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life'}`);

  const artifactPath = path.resolve(__dirname, '../src/config/BOTTxTrace.json');
  if (!fs.existsSync(artifactPath)) {
    console.log('Artifact not found. Compiling first...');
    require('./compile');
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const publicClient = createPublicClient({
    chain: bohrTestnet,
    transport: http(process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life'),
  });

  const walletClient = createWalletClient({
    account,
    chain: bohrTestnet,
    transport: http(process.env.BOTCHAIN_RPC || 'https://rpc.bohr.life'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer Balance: ${Number(balance) / 1e18} BOT`);

  console.log('Deploying BOTTxTrace contract...');
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: `0x${artifact.bytecode}`,
  });

  console.log(`Deployment transaction submitted: ${hash}`);
  console.log('Waiting for receipt confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const contractAddress = receipt.contractAddress;

  console.log('--------------------------------------------------');
  console.log(`BOTTxTrace deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Explorer: ${bohrTestnet.blockExplorers.default.url}/address/${contractAddress}`);
  console.log('--------------------------------------------------');

  // Update deployed.json
  const deployedPath = path.resolve(__dirname, '../src/config/deployed.json');
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

  // Update .env file
  const envPath = path.resolve(__dirname, '../.env');
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

  console.log('Saved contract address to .env and src/config/deployed.json');
}

main().catch((err) => {
  console.error('Deployment failed:', err);
  process.exit(1);
});

