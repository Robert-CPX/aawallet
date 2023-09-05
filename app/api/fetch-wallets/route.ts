import { prisma } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) throw new Error('Address is required');
    if (!isAddress(address)) throw new Error("Invalid address");

    const wallets = await prisma.wallet.findMany({
      where: {
        signers: {
          has: address.toLowerCase(),
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

export default GET;