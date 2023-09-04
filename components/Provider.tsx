'use client'

import { RainbowKitProvider, darkTheme, getDefaultWallets } from '@rainbow-me/rainbowkit'
import React from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { goerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const {chains, publicClient} = configureChains([goerli], [publicProvider()]);

const {connectors} = getDefaultWallets({
  appName: 'aawallet',
  projectId: `${process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID}`,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const Provider = ({children}: {children: React.ReactNode}) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  )
}

export default Provider
