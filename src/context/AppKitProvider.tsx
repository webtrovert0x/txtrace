'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { createAppKit } from '@reown/appkit/react';
import { bohrTestnet } from '@/config/chains';

interface ConfigContextType {
  reownId: string;
  contractAddress: string;
  hasPrivateKey: boolean;
  isReady: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType>({
  reownId: '',
  contractAddress: '',
  hasPrivateKey: false,
  isReady: false,
  refreshConfig: async () => {},
});

export const useAppConfig = () => useContext(ConfigContext);

const queryClient = new QueryClient();

// Fallback wagmi config for Bohr Testnet in case REOWN_ID is not yet set
const defaultWagmiConfig = createConfig({
  chains: [bohrTestnet],
  transports: {
    [bohrTestnet.id]: http('https://rpc.bohr.life'),
  },
});

let appKitInstance: any = null;
export const getGlobalAppKit = () => appKitInstance;

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState({
    reownId: '',
    contractAddress: '',
    hasPrivateKey: false,
  });
  const [wagmiConfig, setWagmiConfig] = useState<any>(defaultWagmiConfig);
  const [isReady, setIsReady] = useState(false);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig({
        reownId: data.reownId || '',
        contractAddress: data.contractAddress || '',
        hasPrivateKey: Boolean(data.hasPrivateKey),
      });

      if (data.reownId && !appKitInstance) {
        try {
          const adapter = new WagmiAdapter({
            projectId: data.reownId,
            networks: [bohrTestnet],
          });

          appKitInstance = createAppKit({
            adapters: [adapter],
            networks: [bohrTestnet],
            projectId: data.reownId,
            defaultNetwork: bohrTestnet,
            metadata: {
              name: 'BOTTxTrace',
              description: 'Transaction Tracer on Botchain Testnet (Chain ID 968)',
              url: 'https://rpc.bohr.life',
              icons: ['https://scan.bohr.life/favicon.ico'],
            },
            features: {
              analytics: false,
            },
            themeMode: 'dark',
            themeVariables: {
              '--w3m-accent': '#2563eb',
              '--w3m-border-radius-master': '4px',
            },
          });

          setWagmiConfig(adapter.wagmiConfig);
        } catch (err) {
          console.warn('AppKit initialization warning:', err);
        }
      }
    } catch (e) {
      console.error('Failed to load app config:', e);
    } finally {
      setIsReady(true);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider
      value={{
        ...config,
        isReady,
        refreshConfig: fetchConfig,
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    </ConfigContext.Provider>
  );
}
