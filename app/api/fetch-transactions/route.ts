import { prisma } from "@/utils/db";
import { isAddress } from "ethers/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { Transaction, TransactionSignature, Wallet } from "@prisma/client";

export type TransactionWithSignature = Transaction & {
  signatures: TransactionSignature[];
  wallet: Wallet;
  pendingSignatures: string[];
};

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Missing wallet address");
    }
    if (!isAddress(walletAddress)) {
      throw new Error("Invalid wallet address");
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        wallet: {
          address: walletAddress,
        },
      },
      include: {
        signatures: true,
        wallet: true,
      },
      orderBy: {
        txHash: {
          sort: "asc",
          nulls: "first",
        },
      },
    });

    const augmentedTransactions: TransactionWithSignature[] = transactions.map((transaction) => {
      const pendingSignatures = transaction.wallet.signers.filter((signer) =>
          !transaction.signatures.find((signature) => signature.signerAddress === signer
        )
      );

      return {
        ...transaction,
        pendingSignatures,
      };
    });
    
    return NextResponse.json({ transactions: augmentedTransactions });
  } catch (e) {
    console.error(e);
    return NextResponse.json({e});
  }
};