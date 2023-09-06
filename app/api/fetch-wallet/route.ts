import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers/lib/utils";
import { prisma } from "@/utils/db";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      throw new Error("Missing walletAddress");
    }
    if (!isAddress(walletAddress)) {
      throw new Error("Invalid walletAddress");
    }

    const wallet = await prisma.wallet.findFirst({
      where: {
        address: walletAddress,
      },
    });
    return NextResponse.json(wallet);
  } catch (error) {
    console.error(error);
    return NextResponse.json({error});
  }
};