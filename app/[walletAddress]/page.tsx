'use client'

import React, { useState } from 'react'
import { parseEther } from 'ethers/lib/utils'
import { getUserOpForETHTransfer } from '@/utils/getUserOpForETHTransfer'
import { useAccount, useWalletClient } from 'wagmi'
import { getUserOpHash } from '@/utils/getUserOpHash'
import TransactionList from '@/components/TransactionList'

const Page = ({
  params: {walletAddress},
}:{
  params: {walletAddress: string},
}) => {
  const [amount, setAmount] = useState(0);
  const [toAddress, setToAddress] = useState("");

  const { address: userAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);

  const fetchUserOp = async () => {
    try {
      const response = await fetch(`/api/fetch-wallet?walletAddress=${walletAddress}`)
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const amountBigInt = parseEther(amount.toString());

      const userOp = await getUserOpForETHTransfer(
        walletAddress,
        data.signers,
        data.salt,
        toAddress,
        amountBigInt,
        data.isDeployed,
      );
      
      if (!userOp) throw new Error('Could not get userOp');
      return userOp;
    } catch (e: any) {
      window.alert(e.message);
      throw new Error(e.message);
    }
  }

  const createTransaction = async () => {
    try {
      setLoading(true);

      if (!userAddress) throw new Error("Could not get user address");
      if (!walletClient) throw new Error("Could not get wallet client");

      const userOp = await fetchUserOp();
      if (!userOp) throw new Error("Could not get userOp");

      const userOpHash = await getUserOpHash(userOp);
      const signature = await walletClient.signMessage({
        message: { raw: userOpHash as `0x${string}` },
      });

      const response = await fetch("/api/create-transaction", {
        method: "POST",
        body: JSON.stringify({
          walletAddress,
          userOp,
          signature,
          signerAddress: userAddress,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      window.alert(
        "Transaction created and signed! Please ask other owners to sign to finally execute the transaction"
      );
      window.location.reload();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }

  // Inside the WalletPage component
  return (
    <div className="flex flex-col py-6 items-center gap-5">
      <h1 className="text-5xl font-bold">Manage Wallet</h1>
      <h3 className="text-xl font-medium border-b border-gray-700">
        {walletAddress}
      </h3>

      <p className="text-lg font-bold">Send ETH</p>

      <input
        className="rounded-lg p-2 text-slate-700"
        placeholder="0x0"
        onChange={(e) => setToAddress(e.target.value)}
      />
      <input
        className="rounded-lg p-2 text-slate-700"
        type="number"
        placeholder="1"
        onChange={(e) => {
          if (e.target.value === "") {
            setAmount(0);
            return;
          }
          setAmount(parseFloat(e.target.value));
        }}
      />
      <button
        className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
        onClick={createTransaction}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
        ) : (
          `Create Txn`
        )}
      </button>
      {userAddress && (
        <TransactionList address={userAddress} walletAddress={walletAddress} />
      )}
    </div>
  );
}

export default Page;
