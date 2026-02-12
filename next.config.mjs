/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Allow Socket.IO websocket connections
  serverExternalPackages: ["mongoose"],
}

export default nextConfig
