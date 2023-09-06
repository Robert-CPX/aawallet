import { TransactionWithSignature } from "@/app/api/fetch-transactions/route";
import React, { useState, useEffect } from "react";
import { getUserOpHash } from "@/utils/getUserOpHash";
import { useWalletClient } from "wagmi";
import { getUserOperationBuilder } from "@/utils/getUserOperationBuilder";
import { BigNumber } from "ethers";
import { BUNDLER_RPC_URL } from "@/utils/constants";
import { Client, IUserOperation } from "userop";
import Icon from "@/components/Icon";

interface TransactionListProps {
  address: string;
  walletAddress: string;
}

const TransactionList = ({address, walletAddress}: TransactionListProps) => {
  const [walletTxns, setWalletTxns] = useState<TransactionWithSignature[]>([]);

  const [loading, setLoading] = useState(false);
  const {data: walletClient} = useWalletClient();

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/fetch-transactions?walletAddress=${walletAddress}`);
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setWalletTxns(data.transactions);
      
    } catch (error) {
      if (error instanceof Error) {
        window.alert(error.message);
      }
      console.error(error);
    }
  };

  const signTransaction = async (txn: TransactionWithSignature) => {
    if (!walletClient) return;
    try {
      setLoading(true);

      const userOpHash = await getUserOpHash(
        txn.userOp as unknown as IUserOperation,
      );
      
      const signature = await walletClient.signMessage({
        message: {raw: userOpHash as `0x${string}`},
      });

      const response = await fetch("/api/create-signature", {
        method: "POST",
        body: JSON.stringify({
          signerAddress: address,
          signature,
          transactionId: txn.id,
        }),
      });
      
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      window.alert("Transaction signed successfully");

      window.location.reload();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) window.alert(error.message);
      setLoading(false);
    }
  };

  const sendTransaction = async (txn: TransactionWithSignature) => {
    try {
      setLoading(true);
      const userOp = txn.userOp as unknown as IUserOperation;

      const client = await Client.init(BUNDLER_RPC_URL);

      const orderedSignatures: string[] = [];

      txn.wallet.signers.forEach((signer) => {
        txn.signatures.forEach((signature) => {
          if (signature.signerAddress === signer) {
            orderedSignatures.push(signature.signature);
          }
        });
      });

      if (orderedSignatures.length !== txn.signatures.length) {
        throw new Error("Fewer signatures than expected");
      }

      let initCode = userOp.initCode as Uint8Array;

      if (txn.wallet.isDeployed) {
        initCode = Uint8Array.from([]);
      }

      const builder = await getUserOperationBuilder(
        userOp.sender,
        BigNumber.from(userOp.nonce),
        initCode,
        userOp.callData.toString(),
        orderedSignatures,
      );

      builder
        .setMaxFeePerGas(userOp.maxFeePerGas)
        .setMaxPriorityFeePerGas(userOp.maxPriorityFeePerGas);

      const result = await client.sendUserOperation(builder);
      const finalUerOpResult = await result.wait();

      const txHashReciept = await finalUerOpResult?.getTransactionReceipt();

      const txHash = txHashReciept?.transactionHash;

      await fetch("/api/update-wallet-deployed", {
        method: "POST",
        body: JSON.stringify({
          walletId: txn.wallet.id,
          transactionId: txn.id,
          txHash,
        }),
      });

      window.alert("Transaction sent successfully");
      window.location.reload();
    } catch (error) {
      console.error(error);
      if (error instanceof Error) window.alert(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  },[address]);

  return (
    <main className="flex flex-col justify-center p-10 items-center gap-5">
      <h1 className="text-5xl font-bold">Transaction</h1>
      {walletTxns.length === 0 && (
        <div className="flex justify-center items-center border-2 border-dashed p-6 rounded-lg">
          <p className="text-lg">You currently have no transactions.</p>
        </div>
      )}
      {walletTxns.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {walletTxns.map((txn) => (
            <div key={txn.id} className="flex flex-col border border-gray-800 rounded-lg gap-2 p-2">
              <span className="bg-gray-800 w-full text-center"> Transaction #{txn.id} </span>
              <div className="flex flex-col gap-2">
                {txn.signatures.map((signature) => (
                  <div key={signature.signature} className="flex font-mono gap-4">
                    <span>{signature.signerAddress}</span>
                    <Icon type="check" />
                  </div>
                ))}
                {txn.pendingSignatures.map((signer) => (
                  <div key={signer} className="flex font-mono gap-4">
                    <span>{signer}</span>
                    <Icon type="xmark" />
                  </div>
                ))}
                {txn.txHash ? (
                  <button
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 rounded-lg"
                    onClick={() => window.open(`https://goerli.etherscan.io/tx/${txn.txHash}`, "_blank")}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto"/>
                    ):(
                      `View on Ethereum`
                    )}
                  </button>
                ) : txn.pendingSignatures.length === 0 ? (
                  <button 
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 px-4 roudned-lg"
                    onClick={() => sendTransaction(txn)}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                    ):(
                      `Execute Txn`
                    )}
                  </button>
                ) : txn.pendingSignatures.includes(address.toLowerCase()) ? (
                  <button 
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 roudned-lg"
                    onClick={() => signTransaction(txn)}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-l-white items-center justify-center mx-auto" />
                    ):(
                      `Sign Txn`
                    )}
                  </button>
                ): (
                  <button
                    className="bg-blue-500 mx-auto hover:bg-blue-700 disabled:bg-blue-500/50 disabled:hover:bg-blue-500/50 hover:transition-colors text-white font-bold py-2 w-fit px-4 roudned-lg"
                    disabled
                  >
                    No Action Reqd
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default TransactionList
