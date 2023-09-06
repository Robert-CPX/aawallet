import { prisma } from "@/utils/db";
import { NextResponse, NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const { signature, signerAddress, transactionId } = await req.json();

    await prisma.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        signatures: {
          create: {
            signature,
            signerAddress: signerAddress.toLowerCase(),
          },
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (e) {
    console.error(e);
    return NextResponse.json({e});
  }
};