/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Catatan: blok "turbopack" sudah dihapus karena kita beralih ke webpack.
};

export default nextConfig;