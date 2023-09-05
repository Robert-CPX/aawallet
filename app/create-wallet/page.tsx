import CreateAAWallet from '@/components/CreateAAWallet'
import React from 'react'

const Page = () => {
  return (
    <main className='flex flex-col py-6 items-center gap-5'>
      <h1 className='text-5xl font-bold'>Create Wallet</h1>
      <p className='text-gray-400'>Enter the signer address for this account</p>
      <CreateAAWallet />
    </main>
  )
}

export default Page
