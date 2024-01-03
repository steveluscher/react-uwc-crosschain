# React Universal Wallet Connector - Crosschain

## Overview

Welcome to the documentation for the React Universal Wallet Connector - Crosschain package! This package provides easy-to-use hooks for seamless integration with Solana, Ethereum, and Polygon (Matic) in your React applications.

## Features

- **Unified Interface:** Three hooks (`useSol`, `useEth`, and `useMatic`) with a consistent set of functions for wallet management and transactions.
- **Wallet Management:** Functions to interact with wallets, retrieve wallet addresses, balances, and send transactions.
- **Initialization:** Seamless initialization and auto reconnection process for connecting to the supported blockchains.

## Installation

Before installing your-react-blockchain-package, make sure to install the following peer dependencies:

```bash
npm install react @solana/spl-token @solana/web3.js ethers jotai
# or
yarn add react @solana/spl-token @solana/web3.js ethers jotai
```

Now, you can install your-react-blockchain-package:

````bash
npm install your-react-blockchain-package
# or
yarn add your-react-blockchain-package
````

## Usage

### 1. Import the Hooks

```jsx
import { useSol, useEth, useMatic } from "@ada-anvil/react-uwc-crosschain";
````

### 2. Initialize the Hook

Choose the appropriate hook based on the blockchain you want to interact with:

```jsx
// For Solana
const {
  wallet,
  wallets,
  initializing,
  initialize,
  select,
  getAddress,
  getBalance,
  send,
} = useSol();

// For Ethereum
const {
  wallet,
  wallets,
  initializing,
  initialize,
  select,
  getAddress,
  getBalance,
  send,
} = useEth();

// For Polygon (Matic)
const {
  wallet,
  wallets,
  initializing,
  initialize,
  select,
  getAddress,
  getBalance,
  send,
} = useMatic();
```

### 3. Use the Functions

Now you can use the exposed functions seamlessly across different blockchains:

```jsx
// Example: Get the current wallet address
const currentAddress = await getAddress();

// Example: Send coins
const sendCoins = async (to, amount) => {
  try {
    const transactionHash = await send({ to, amount });
    console.log(`Transaction sent successfully. Hash: ${transactionHash}`);
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
};
```

### 4. Complete Example

For a more complete example, consider the following:

```jsx
import React, { useEffect } from "react";
import { useSol, useEth, useMatic } from "@ada-anvil/react-uwc-crosschain";

const MyBlockchainComponent = () => {
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
};

export default MyBlockchainComponent;
```
