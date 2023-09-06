import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers/lib/utils";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) throw new Error('Address is required');
    if (!isAddress(walletAddress)) throw new Error("Invalid address");

    const wallets = await prisma.wallet.findMany({
      where: {
        signers: {
          has: walletAddress.toLowerCase(),
        },
      },
      include: {
        _count: {
          select: {
            transactions: true,
          }
        }
      }
    });
    return NextResponse.json(wallets);
  } catch (error) {
    console.error(error);
    return NextResponse.json({error})
  }
}