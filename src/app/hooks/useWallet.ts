import { useCallback, useEffect, useState } from 'react';

// Minimal EIP-1193 wallet hook (MetaMask, Coinbase Wallet, ...). No wallet library needed.

interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: never[]) => void): void;
  removeListener?(event: string, handler: (...args: never[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const CHAINS: Record<
  number,
  { chainName: string; rpcUrls: string[]; blockExplorerUrls: string[] }
> = {
  8453: {
    chainName: 'Base',
    rpcUrls: ['https://mainnet.base.org'],
    blockExplorerUrls: ['https://basescan.org'],
  },
  84532: {
    chainName: 'Base Sepolia',
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  },
};

export const TARGET_CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID || 84532);
export const EXPLORER_URL = CHAINS[TARGET_CHAIN_ID]?.blockExplorerUrls[0] ?? 'https://basescan.org';
const GRID_TOKEN = import.meta.env.VITE_GRID_TOKEN_ADDRESS as string | undefined;

/** ABI-encodes `balanceOf(address)` for an ERC-20 eth_call. */
export function encodeBalanceOf(account: string): string {
  return `0x70a08231${account.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
}

export interface Wallet {
  account: string | null;
  chainId: number | null;
  wrongChain: boolean;
  targetChainName: string;
  gridBalance: number | null;
  hasWallet: boolean;
  error: string | null;
  connect(): Promise<void>;
  disconnect(): void;
  switchChain(): Promise<void>;
}

export function useWallet(): Wallet {
  const eth = typeof window !== 'undefined' ? window.ethereum : undefined;
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [gridBalance, setGridBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eth) return;
    const onAccounts = (accounts: string[]) => setAccount(accounts[0] ?? null);
    const onChain = (id: string) => setChainId(Number(id));
    eth.request({ method: 'eth_accounts' }).then(
      (a) => onAccounts(a as string[]),
      () => {},
    );
    eth.request({ method: 'eth_chainId' }).then(
      (id) => onChain(id as string),
      () => {},
    );
    eth.on?.('accountsChanged', onAccounts);
    eth.on?.('chainChanged', onChain);
    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [eth]);

  useEffect(() => {
    if (!eth || !account || !GRID_TOKEN || chainId !== TARGET_CHAIN_ID) {
      setGridBalance(null);
      return;
    }
    let alive = true;
    eth
      .request({
        method: 'eth_call',
        params: [{ to: GRID_TOKEN, data: encodeBalanceOf(account) }, 'latest'],
      })
      .then(
        (hex) => alive && setGridBalance(Number(BigInt(hex as string)) / 1e18),
        () => alive && setGridBalance(null),
      );
    return () => {
      alive = false;
    };
  }, [eth, account, chainId]);

  const connect = useCallback(async () => {
    setError(null);
    if (!eth) {
      setError('No wallet found. Install a browser wallet such as MetaMask or Coinbase Wallet.');
      return;
    }
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      setAccount(accounts[0] ?? null);
    } catch (e) {
      setError(
        (e as { code?: number })?.code === 4001
          ? 'Connection request was declined.'
          : 'Couldn’t connect the wallet.',
      );
    }
  }, [eth]);

  const switchChain = useCallback(async () => {
    if (!eth) return;
    const hexId = `0x${TARGET_CHAIN_ID.toString(16)}`;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexId }] });
    } catch (e) {
      const chain = CHAINS[TARGET_CHAIN_ID];
      if ((e as { code?: number })?.code === 4902 && chain) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexId,
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              ...chain,
            },
          ],
        });
      }
    }
  }, [eth]);

  return {
    account,
    chainId,
    wrongChain: Boolean(account && chainId && chainId !== TARGET_CHAIN_ID),
    targetChainName: CHAINS[TARGET_CHAIN_ID]?.chainName ?? `chain ${TARGET_CHAIN_ID}`,
    gridBalance,
    hasWallet: Boolean(eth),
    error,
    connect,
    disconnect: () => setAccount(null),
    switchChain,
  };
}
