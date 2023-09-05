'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import React from 'react'

const Navbar = () => {
  return (
    <div className="w-full px-6 border-b border-b-gray-700 py-2 flex justify-between items-center">
      <div className="gap-4 flex">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/create-wallet" className="hover:underline">Create New Wallet</Link>
      </div>
      <ConnectButton />
    </div>
  )
}

export default Navbar
