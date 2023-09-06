import { prisma } from "@/utils/db";
import { isAddress } from "ethers/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export const POST =async (req: NextRequest) => {
  try {
    const { walletAddress, userOp, signerAddress, signature } = await req.json();
    if (!isAddress(walletAddress)) {
      throw new Error("Missing walletAddress");
    }

    await prisma.transaction.create({
      data: {
        wallet: {
          connect: {
            address: walletAddress,
          },
        },
        userOp,
        signatures: {
          create: {
            signature,
            signerAddress: signerAddress.toLowerCase(),
          },
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({error});
  }
}