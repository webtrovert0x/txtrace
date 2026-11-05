const fs = require('fs');
const path = require('path');
const solc = require('solc');

function compile() {
  const contractPath = path.resolve(__dirname, '../contracts/BOTTxTrace.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'BOTTxTrace.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode'],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  };

  console.log('Compiling BOTTxTrace.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === 'error') {
        hasError = true;
        console.error('Compilation Error:', error.formattedMessage);
      } else {
        console.warn('Compilation Warning:', error.formattedMessage);
      }
    }
    if (hasError) {
      process.exit(1);
    }
  }

  const contract = output.contracts['BOTTxTrace.sol']['BOTTxTrace'];
  const artifactDir = path.resolve(__dirname, '../src/config');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const artifactPath = path.join(artifactDir, 'BOTTxTrace.json');
  fs.writeFileSync(
    artifactPath,
    JSON.stringify(
      {
        contractName: 'BOTTxTrace',
        abi: contract.abi,
        bytecode: contract.evm.bytecode.object,
        deployedBytecode: contract.evm.deployedBytecode.object,
      },
      null,
      2
    )
  );

  console.log(`Compiled successfully! Artifact written to ${artifactPath}`);
}

compile();

