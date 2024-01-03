import { Modify } from "../commons/types";
import {
  EvmGetBalanceParams,
  EvmSendParams,
  EvmWallet,
  EvmWalletState,
} from "../evm/types";

export type UseMaticProps = {
  autoConnect?: boolean;
};

export enum MaticWalletNames {
  Metamask = "Metamask",
  Phantom = "Phantom",
}

export type MaticWallet = Modify<
  EvmWallet,
  {
    name: MaticWalletNames;
  }
>;

export type MaticWalletState = Modify<
  NonNullable<EvmWalletState>,
  {
    name: MaticWalletNames;
  }
> | null;

export type MaticSendParams = Omit<EvmSendParams, "chainId">;

export type MaticGetBalanceParams = Omit<
  EvmGetBalanceParams,
  "chainId" | "formatted"
> & { formatted?: boolean };
