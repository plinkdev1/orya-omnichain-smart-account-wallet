/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: [
    '@orya/wallet-core',
    '@orya/wallet-sdk',
    '@orya/shared-types',
    '@orya/shared-utils',
    '@orya/shared-ui',
  ],
};

export default nextConfig;