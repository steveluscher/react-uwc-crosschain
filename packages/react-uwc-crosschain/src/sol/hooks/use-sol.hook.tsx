import { useEffect, useMemo, useRef } from "react";
import { atom, useAtom } from "jotai";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SendOptions,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  SolAdapter,
  SolGetBalanceParams,
  SolSendParams,
  SolWallet,
  SolWalletNames,
  SolWalletState,
  UseSolProps,
} from "../types";
import nufiMedia from "../medias/nufi.media";
import { parseAdapter } from "../../commons/medias/utils/parse-adapter.util";
import phantomMedia from "../../commons/medias/phantom.media";

const WALLET_STORAGE_KEY = "uv-sol-wallet";

const SUPPORTED_WALLETS: SolWallet[] = [
  {
    name: SolWalletNames.Phantom,
    icon: `data:image/svg+xml;utf8,${encodeURIComponent(phantomMedia)}`,
    adapter: parseAdapter("phantom.solana"),
    installed: false,
  },
  {
    name: SolWalletNames.NuFi,
    icon: `data:image/svg+xml;utf8,${encodeURIComponent(nufiMedia)}`,
    adapter: parseAdapter("nufiSolana"),
    installed: false,
  },
];

const solWalletsAtom = atom<SolWallet[]>([]);
const solWalletAtom = atom<SolWalletState>(null);
const solInitializing = atom<boolean>(true);

const useSol = (props?: UseSolProps) => {
  const { autoConnect, endpoint } = props || {};

  const [wallets, setWallets] = useAtom(solWalletsAtom);
  const [wallet, setWallet] = useAtom(solWalletAtom);
  const [initializing, setInitializing] = useAtom(solInitializing);

  const adapter = useRef<SolAdapter | null>();

  const connection = useMemo(() => {
    if (!endpoint) throw new Error("No solana endpoint provided");
    return new Connection(endpoint);
  }, [endpoint]);

  useEffect(() => {
    const list: SolWallet[] = [];

    SUPPORTED_WALLETS.forEach((supportedWallet) => {
      list.push({ ...supportedWallet, installed: !!supportedWallet.adapter });
    });

    setWallets(list);

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

  const initialize = async () => {
    try {
      setInitializing(true);
      await getAdapter();
      setInitializing(false);
    } catch (error) {
      setInitializing(false);
    }
  };

  const select = async (name: SolWalletNames) => {
    ensureClientSide();

    if (!wallets) throw new Error("Wallets list undefined");

    const wallet = wallets.find((w) => w.name === name);

    if (!wallet) throw new Error("Wallet not found");

    adapter.current = wallet.adapter;

    setWallet({ name: wallet.name, connected: false, connecting: true });

    if (!adapter.current.isConnected) {
      await adapter.current.connect();
      localStorage.setItem(WALLET_STORAGE_KEY, wallet.name);
    }

    setWallet({ name: wallet.name, connected: true, connecting: false });

    return wallet.adapter;
  };

  const getAdapter = async () => {
    ensureClientSide();

    if (adapter.current) return adapter.current;

    const walletName = localStorage.getItem(
      WALLET_STORAGE_KEY
    ) as SolWalletNames;

    if (walletName) return select(walletName);

    throw new Error("No Sol wallet installed");
  };
  const getPublicKey = async () => {
    const solAdapter = await getAdapter();
    if (!solAdapter.publicKey) throw new Error("Could not find public key");

    return new PublicKey(solAdapter.publicKey.toBytes());
  };

  const prepareTransaction = async (
    transaction: Transaction,
    options: SendOptions = {}
  ) => {
    const publicKey = await getPublicKey();

    transaction.feePayer = transaction.feePayer || publicKey;

    if (!transaction.recentBlockhash) {
      const { blockhash } = await connection.getLatestBlockhash({
        commitment: options.preflightCommitment,
        minContextSlot: options.minContextSlot,
      });

      transaction.recentBlockhash = blockhash;
    }

    return transaction;
  };
  const send = async ({ to, amount, token }: SolSendParams) => {
    const solAdapter = await getAdapter();
    const publicKey = await getPublicKey();

    let transaction;

    if (token?.address) {
      const {
        getAssociatedTokenAddress,
        createAssociatedTokenAccountInstruction,
        createTransferInstruction,
      } = await import("@solana/spl-token");

      const tokenAccount = await getTokenAccount(token.address);

      if (!tokenAccount.account || !tokenAccount.publicKey) {
        throw new Error("Token not found");
      }

      const balance = Number(
        tokenAccount.account.data.parsed.info.tokenAmount.uiAmount
      );

      if (amount > balance) {
        throw new Error("Insufficient balance");
      }

      const mintToken = new PublicKey(
        tokenAccount.account.data.parsed.info.mint
      );

      const recipientAddress = new PublicKey(to);

      const transactionInstructions: TransactionInstruction[] = [];

      const associatedTokenTo = await getAssociatedTokenAddress(
        mintToken,
        recipientAddress
      );

      if (!(await connection.getAccountInfo(associatedTokenTo))) {
        transactionInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            associatedTokenTo,
            recipientAddress,
            mintToken
          )
        );
      }

      transactionInstructions.push(
        createTransferInstruction(
          new PublicKey(tokenAccount.publicKey),
          associatedTokenTo,
          publicKey,
          tokenAccount.account.data.parsed.info.tokenAmount.amount
        )
      );

      const transaction = new Transaction().add(...transactionInstructions);

      const preparedTransaction = await prepareTransaction(transaction);

      const { signature } =
        await solAdapter.signAndSendTransaction(preparedTransaction);

      return signature;
    } else {
      const balance = await getBalance();

      if (amount > balance) {
        throw new Error("Insufficient balance");
      }

      transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(to),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );
    }

    transaction = await prepareTransaction(transaction as Transaction);

    const { signature } = await solAdapter.signAndSendTransaction(transaction);

    return signature;
  };

  const getAddress = async () => {
    const publicKey = await getPublicKey();
    return publicKey.toBase58();
  };

  const getTokenAccount = async (address: string) => {
    const publicKey = await getPublicKey();

    const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      mint: new PublicKey(address),
    });

    return {
      account: accounts.value[0]?.account,
      publicKey: accounts.value[0]?.pubkey.toBase58(),
    };
  };

  const getBalance = async (params?: SolGetBalanceParams) => {
    const { token, formatted = true } = params || {};

    const publicKey = await getPublicKey();

    if (token?.address) {
      const { account } = await getTokenAccount(token.address);

      if (!account) return 0;

      if (formatted)
        return Number(account.data.parsed.info.tokenAmount.uiAmount);

      return Number(account.data.parsed.info.tokenAmount.amount);
    }

    const balance = await connection.getBalance(publicKey);

    if (formatted) return balance / LAMPORTS_PER_SOL;
    return balance;
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

export default useSol;
