import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { walletId, transactionId, txHash } = await req.json();

    await prisma.wallet.update({
      where: {
        id: walletId,
      },
      data: {
        isDeployed: true,
      },
    });

    const res = await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        txHash,
      },
    });

    return NextResponse.json(res);
  } catch (e) {
    console.error(e);
    return NextResponse.json({e});
  }
};