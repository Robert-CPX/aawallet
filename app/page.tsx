'use client'

import WalletList from '@/components/WalletList'
import Link from 'next/link'
import React from 'react'
import { useAccount } from 'wagmi'

const Home = () => {
  const { isConnected, address } = useAccount();

  return (
    <main className='flex flex-col py-6'>
      <div className='flex flex-col h-full gap-6 justify-center items-center'>
        <>
        {isConnected && (
          <Link 
            href='/create-wallet' 
            className='px-4 py-2 bg-blue-500 transition-colors hover:bg-blue-600 rounded-lg font-bold'
          >
            Create New Wallet
          </Link>
        )}
        {address && <WalletList address={address} />}
        </>
      </div>
    </main>
  )
}

export default Home
