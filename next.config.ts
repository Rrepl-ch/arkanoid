import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    config.resolve.fallback = {
      ...config.resolve?.fallback,
      '@solana-program/token': false,
      '@solana/rpc-api': false,
      '@react-native-async-storage/async-storage': false,
    }
    return config
  },
}

export default nextConfig
