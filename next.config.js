/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: [
      'hebbkx1anhila5yf.public.blob.vercel-storage.com',
      'tech0gen8step4pekstorage.blob.core.windows.net',
    ],
    unoptimized: true,  // 画像最適化を無効化
  },
}

module.exports = nextConfig
