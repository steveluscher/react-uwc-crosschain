import {
  MaticGetBalanceParams,
  MaticSendParams,
  MaticWalletNames,
  MaticWallet,
  MaticWalletState,
  UseMaticProps,
} from "../types";

import { useEvm } from "../../evm";
import metamaskMedia from "../../commons/medias/metamask.media";
import { EvmChainId, EvmWallet, EvmWalletNames } from "../../evm/types";
import phantomMedia from "../../commons/medias/phantom.media";
import { parseAdapter } from "../../commons/medias/utils/parse-adapter.util";

const WALLET_STORAGE_KEY = "uv-eth-wallet";

const CHAIN_ID = EvmChainId.MATIC;

const SUPPORTED_WALLETS: EvmWallet[] = [
  {
    name: EvmWalletNames.Metamask,
    icon: `data:image/svg+xml;utf8,${encodeURIComponent(metamaskMedia)}`,
    adapter: parseAdapter("ethereum"),
    installed: false,
  },
  {
    name: EvmWalletNames.Phantom,
    icon: `data:image/svg+xml;utf8,${encodeURIComponent(phantomMedia)}`,
    adapter: parseAdapter("phantom.ethereum"),
    installed: false,
  },
];

const useMatic = (props?: UseMaticProps) => {
  const { autoConnect } = props || {};

  const evmHook = useEvm({
    storageKey: WALLET_STORAGE_KEY,
    supportedWallets: SUPPORTED_WALLETS,
    autoConnect,
  });

  const select = async (name: MaticWalletNames) =>
    evmHook.select(name as unknown as EvmWalletNames);

  const send = async (params: MaticSendParams) =>
    evmHook.send({ ...params, chainId: CHAIN_ID });

  const getBalance = async (params?: MaticGetBalanceParams) =>
    evmHook.getBalance({ ...params, chainId: CHAIN_ID });

  const getAddress = async () => evmHook.getAddress({ chainId: CHAIN_ID });

  return {
    ...evmHook,
    wallet: evmHook.wallet as unknown as MaticWalletState,
    wallets: evmHook.wallets as unknown as MaticWallet[],
    select,
    send,
    getBalance,
    getAddress,
  };
};

export default useMatic;
