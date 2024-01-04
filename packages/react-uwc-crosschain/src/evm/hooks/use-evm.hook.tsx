import { useCallback, useEffect, useMemo, useRef } from "react";
import { atom, useAtom } from "jotai";
import {
  EvmAdapter,
  EvmGetAddressParams,
  EvmGetBalanceParams,
  EvmSendParams,
  EvmWallet,
  EvmWalletNames,
  EvmWalletState,
  UseEvmProps,
} from "../types";
import {
  BigNumberish,
  BrowserProvider,
  JsonRpcSigner,
  TransactionResponse,
  ethers,
  formatEther,
  parseEther,
  parseUnits,
} from "ethers";
import abi from "../abi";
import { useAtomCallback } from "jotai/utils";

const evmWalletsAtom = atom<{ [key: string]: EvmWallet[] }>({});
const evmWalletAtom = atom<{ [key: string]: EvmWalletState }>({});
const evmInitializing = atom<{ [key: string]: boolean }>({});

const useEvm = (props: UseEvmProps) => {
  const { autoConnect, storageKey, supportedWallets } = props || {};

  const [wallet, setWallet] = useAtom(
    useMemo(
      () =>
        atom(
          (get) => {
            const obj = get(evmWalletAtom);
            return obj[storageKey];
          },
          (get, set, value: EvmWalletState) => {
            const obj = get(evmWalletAtom);
            set(evmWalletAtom, { ...obj, [storageKey]: value });
          }
        ),
      []
    )
  );

  const [wallets, setWallets] = useAtom(
    useMemo(
      () =>
        atom(
          (get) => {
            const obj = get(evmWalletsAtom);
            return obj[storageKey] || [];
          },
          (get, set, value: EvmWallet[]) => {
            const obj = get(evmWalletsAtom);
            set(evmWalletsAtom, { ...obj, [storageKey]: value });
          }
        ),
      []
    )
  );

  const [initializing, setInitializing] = useAtom(
    useMemo(
      () =>
        atom(
          (get) => {
            const obj = get(evmInitializing);
            return obj[storageKey] ?? true;
          },
          (get, set, value: boolean) => {
            const obj = get(evmInitializing);
            set(evmInitializing, { ...obj, [storageKey]: value });
          }
        ),
      []
    )
  );

  const walletStateReady = useAtomCallback(
    useCallback((get) => {
      const w = get(evmWalletAtom);
      const walletState = {
        ...w[storageKey],
        connected: true,
        connecting: false,
      };

      setWallet(walletState as EvmWalletState);

      return walletState;
    }, [])
  );

  const adapter = useRef<EvmAdapter | null>();
  const provider = useRef<BrowserProvider | null>();
  const signer = useRef<JsonRpcSigner | null>();

  useEffect(() => {
    const list: EvmWallet[] = [];

    supportedWallets.forEach((supportedWallet) => {
      list.push({ ...supportedWallet, installed: !!supportedWallet.adapter });
    });

    setWallets(list);
  }, []);

  useEffect(() => {
    if (
      wallets.length &&
      !wallet?.connected &&
      !wallet?.connecting &&
      autoConnect
    ) {
      initialize();
    }
  }, [wallet, wallets]);

  const ensureClientSide = () => {
    if (typeof window === "undefined") {
      throw new Error("This method is only available on client side");
    }
  };

  const isProviderReady = () => {
    return (
      provider.current
        ?.send("eth_accounts", [])
        .then((accounts) => accounts.length > 0) ?? false
    );
  };

  const initialize = async () => {
    try {
      setInitializing(true);
      await getAdapter();
      setInitializing(false);
    } catch (error) {
      setInitializing(false);
    }
  };

  const select = async (name: EvmWalletNames) => {
    if (!wallets) throw new Error("Wallets list undefined");

    const wallet = wallets.find((w) => w.name === name);

    if (!wallet) throw new Error("Wallet not found");

    adapter.current = wallet.adapter;
    provider.current = null;
    signer.current = null;

    setWallet({
      name: wallet.name,
      connected: false,
      connecting: true,
    });

    await setupWallet();

    localStorage.setItem(storageKey, wallet.name);
    return wallet.adapter;
  };

  const getAdapter = async () => {
    if (adapter.current) return adapter.current;

    const walletName = localStorage.getItem(storageKey) as EvmWalletNames;

    if (walletName) {
      const adapter = await select(walletName);
      if (!adapter) throw new Error("No Evm wallet installed");
      return adapter;
    }

    throw new Error("No Evm wallet installed");
  };

  const updateProvider = async () => {
    // Make sure we are on the client side
    ensureClientSide();

    // Check if MetaMask is installed
    const eip = await getAdapter();

    // Return the provider if already set
    if (provider.current) return provider.current;

    provider.current = new ethers.BrowserProvider(eip, "any");
  };

  const updateSigner = async () => {
    // Return the signer if already set
    if (signer.current) {
      walletStateReady();
      return signer.current;
    }

    // Set the provider if it is not already set
    if (!provider) updateProvider();

    const eip = await getAdapter();

    signer.current = (await provider.current?.getSigner()) ?? null;

    if (eip.isConnected()) {
      walletStateReady();
    }
  };

  const setupWallet = async () => {
    await updateProvider();
    await updateSigner();
    await isProviderReady();
  };

  const send = async ({ to, amount, token, chainId }: EvmSendParams) => {
    if (!signer.current) throw new Error("Signer not initialized");
    if (!provider.current) throw new Error("Provider not initialized");

    await provider.current.send("wallet_switchEthereumChain", [
      {
        chainId,
      },
    ]);

    const { address } = token || {};
    const balance = await getBalance({
      chainId,
      token: { address },
      formatted: false,
    });

    if (address) {
      const contract = new ethers.Contract(address, abi, signer.current);

      if (!contract.decimals || !contract.transfer)
        throw new Error("Evmers contract implemantation not found");

      const decimals = await contract.decimals();

      if (Number(balance) < amount) {
        throw new Error("Insufficient balance");
      }

      const numberOfTokens = parseUnits(amount.toString(), decimals);
      const tx: TransactionResponse = await contract.transfer(
        to,
        numberOfTokens
      );

      return tx.hash;
    }

    const value = parseEther(amount.toString()) as BigNumberish;

    if (Number(balance) < Number(value)) {
      throw new Error("Insufficient balance");
    }

    const tx = await signer.current.sendTransaction({ to, value });

    return tx.hash;
  };

  const getBalance = async (params?: EvmGetBalanceParams) => {
    const { token, chainId, formatted = true } = params || {};

    if (!signer.current) throw new Error("Signer not initialized");
    if (!provider.current) throw new Error("Provider not initialized");

    await provider.current.send("wallet_switchEthereumChain", [
      {
        chainId,
      },
    ]);

    if (token?.address) {
      const contract = new ethers.Contract(token.address, abi, signer.current);

      if (!contract.decimals || !contract.balanceOf)
        throw new Error("Evmers contract implemantation not found");

      const decimals = await contract.decimals();
      const unformattedBalance: number = await contract.balanceOf(
        signer.current.address
      );

      if (formatted) return ethers.formatUnits(unformattedBalance, decimals);
      return unformattedBalance;
    }

    const balance = await provider.current.getBalance(signer.current.address);
    if (formatted) return formatEther(balance);
    return Number(balance);
  };

  const getAddress = async (params: EvmGetAddressParams) => {
    if (!signer) throw new Error("Signer not initialized");
    if (!provider) throw new Error("Provider not initialized");

    const { chainId } = params;

    await provider.current?.send("wallet_switchEthereumChain", [
      {
        chainId,
      },
    ]);

    return signer.current?.address;
  };

  return {
    wallet,
    wallets,
    initializing,
    initialize,
    select,
    getAddress,
    getBalance,
    send,
  };
};

export default useEvm;
