import { Eip1193Provider } from "ethers";

declare global {
  interface Window {
    ethereum: EvmAdapter | null;
    phantom: { ethereum: EvmAdapter; solana: any };
    nufiSolana: any;
  }
}

export type UseEvmProps = {
  autoConnect?: boolean;
  storageKey: string;
  supportedWallets: EvmWallet[];
};

export type EvmAdapter = Eip1193Provider & {
  isConnected: () => boolean;
};

export enum EvmWalletNames {
  Metamask = "Metamask",
  Phantom = "Phantom",
}

export type EvmWallet = {
  name: EvmWalletNames;
  icon: string;
  adapter: EvmAdapter | null;
  installed: boolean;
};

export enum EvmChainId {
  ETH = "0x1",
  MATIC = "0x89",
}

export type EvmSendParams = {
  to: string;
  amount: number;
  chainId: EvmChainId;
  token?: {
    address: string;
  };
};

export type EvmGetBalanceParams = {
  token?: { address: string | undefined };
  formatted?: boolean;
  chainId: EvmChainId;
};

export type EvmGetAddressParams = {
  chainId: EvmChainId;
};

export type EvmWalletState = {
  name: EvmWalletNames;
  connected: boolean;
  connecting: boolean;
} | null;
