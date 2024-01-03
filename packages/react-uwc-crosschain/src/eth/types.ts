import { Modify } from "../commons/types";
import {
  EvmGetBalanceParams,
  EvmSendParams,
  EvmWallet,
  EvmWalletState,
} from "../evm/types";

export type UseEthProps = {
  autoConnect?: boolean;
};

export enum EthWalletNames {
  Metamask = "Metamask",
  Phantom = "Phantom",
}

export type EthWallet = Modify<
  EvmWallet,
  {
    name: EthWalletNames;
  }
>;

export type EthWalletState = Modify<
  NonNullable<EvmWalletState>,
  {
    name: EthWalletNames;
  }
> | null;

export type EthSendParams = Omit<EvmSendParams, "chainId">;

export type EthGetBalanceParams = Omit<EvmGetBalanceParams, "chainId">;
