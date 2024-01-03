"use client";

import { EthWalletNames, useEth } from "@ada-anvil/react-uwc-crosschain/eth";

import Image from "next/image";

export default function Page(): JSX.Element {
  const { initializing, wallet, wallets, select, getAddress, getBalance } =
    useEth({ autoConnect: true });

  const onClick = async (walletName: EthWalletNames) => {
    await select(walletName);
  };

  const handleGetAddress = async () => {
    if (!wallet?.connected) throw new Error("Wallet not connected");
    console.log(await getAddress());
  };

  const handleGetBalance = async () => {
    if (!wallet?.connected) throw new Error("Wallet not connected");
    console.log(await getBalance());
  };

  return (
    <main>
      <h1>Universal Wallets</h1>
      <h3>{`Your are connected with ${
        initializing ? "" : wallet?.connected ? wallet.name : "Not connected"
      }`}</h3>
      {wallets.map((wallet) => {
        return (
          <div key={wallet.name} onClick={() => onClick(wallet.name)}>
            <Image width={40} height={40} src={wallet.icon} alt={wallet.name} />
            <p>
              {wallet.name} -{" "}
              {wallet.installed ? "(Installed)" : "(Not installed)"}
            </p>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        <button onClick={handleGetAddress}>Address</button>
        <button onClick={handleGetBalance}>Balance</button>
      </div>
    </main>
  );
}
