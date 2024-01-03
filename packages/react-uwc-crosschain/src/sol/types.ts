import {
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";

export type UseSolProps = {
  autoConnect?: boolean;
  endpoint?: string | undefined;
};

export type SolAdapter = {
  isPhantom?: boolean;
  publicKey?: { toBytes(): Uint8Array };
  isConnected: boolean;
  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T
  ): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[]
  ): Promise<T[]>;
  signAndSendTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
    options?: SendOptions
  ): Promise<{ signature: TransactionSignature }>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
};

export enum SolWalletNames {
  Phantom = "Phantom",
  NuFi = "NuFi",
}

export type SolWallet = {
  name: SolWalletNames;
  icon: string;
  adapter: SolAdapter;
  installed: boolean;
};

export type SolTokenOptions = { token?: { address: string } };

export type SolSendParams = {
  to: string;
  amount: number;
} & SolTokenOptions;

export type SolGetBalanceParams = {
  formatted?: boolean;
} & SolTokenOptions;

export type SolWalletState = {
  name: SolWalletNames;
  connected: boolean;
  connecting: boolean;
} | null;
