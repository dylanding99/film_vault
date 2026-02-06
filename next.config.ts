/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove output: 'export' to support dynamic routes in Tauri
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
