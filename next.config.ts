
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // In a future major version of Next.js, you will need to explicitly configure "allowedDevOrigins" in next.config to allow cross-origin requests.
  // Read more: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [
    '*.cloudworkstations.dev',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensures HMR works correctly in this environment
      config.watchOptions.poll = 300;
      config.devServer = {
        ...(config.devServer || {}),
        webSocketURL: {
          protocol: 'wss',
          port: 443,
          hostname: process.env.NEXT_PUBLIC_HOST_URL?.split('//')[1] || 'localhost',
          pathname: '/_next/webpack-hmr',
        },
      };
    }
    return config;
  },
};

export default nextConfig;
