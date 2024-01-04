import {
  EthGetBalanceParams,
  EthSendParams,
  EthWallet,
  EthWalletNames,
  EthWalletState,
  UseEthProps,
} from "../types";

import { useEvm } from "../../evm";
import metamaskMedia from "../../commons/medias/metamask.media";
import { EvmChainId, EvmWallet, EvmWalletNames } from "../../evm/types";
import phantomMedia from "../../commons/medias/phantom.media";
import { parseAdapter } from "../../commons/medias/utils/parse-adapter.util";
import exodusMedia from "../../commons/medias/exodus.media";

const WALLET_STORAGE_KEY = "uv-eth-wallet";

const CHAIN_ID = EvmChainId.ETH;

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
  {
    name: EvmWalletNames.Exodus,
    icon: `data:image/svg+xml;utf8,${encodeURIComponent(exodusMedia)}`,
    adapter: parseAdapter("exodus.solana"),
    installed: false,
  },
];

const useEth = (props?: UseEthProps) => {
  const { autoConnect } = props || {};

  const evmHook = useEvm({
    storageKey: WALLET_STORAGE_KEY,
    supportedWallets: SUPPORTED_WALLETS,
    autoConnect,
  });

  const select = async (name: EthWalletNames) =>
    evmHook.select(name as unknown as EvmWalletNames);

  const send = async (params: EthSendParams) =>
    evmHook.send({ ...params, chainId: CHAIN_ID });

  const getBalance = async (params?: EthGetBalanceParams) =>
    evmHook.getBalance({ ...params, chainId: CHAIN_ID });

  const getAddress = async () => evmHook.getAddress({ chainId: CHAIN_ID });

  return {
    ...evmHook,
    wallet: evmHook.wallet as unknown as EthWalletState,
    wallets: evmHook.wallets as unknown as EthWallet[],
    select,
    send,
    getBalance,
    getAddress,
  };
};

export default useEth;
