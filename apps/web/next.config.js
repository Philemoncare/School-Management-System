const os = require('os')

/** @type {import('next').NextConfig} */
const apiOrigin = (
  process.env.API_INTERNAL_URL ||
  process.env.API_URL ||
  'http://127.0.0.1:4000'
).replace(/\/+$/, '')

// Next blocks dev-only assets from origins other than localhost, which leaves
// the page as inert HTML (no React) when opened from a phone over the LAN -
// taps on the select do nothing and forms submit natively, reloading the page.
// Register this machine's own IPv4 addresses so devices on the same network can
// hydrate normally. This option only applies to `next dev`.
const lanOrigins = Object.values(os.networkInterfaces())
  .flat()
  .filter((entry) => entry && entry.family === 'IPv4' && !entry.internal)
  .map((entry) => entry.address)

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [...new Set([...lanOrigins, '*.local'])],
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
