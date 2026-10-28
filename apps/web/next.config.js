/** @type {import('next').NextConfig} */
const apiOrigin = (
  process.env.API_INTERNAL_URL ||
  process.env.API_URL ||
  'http://127.0.0.1:4000'
).replace(/\/+$/, '')

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
