
import type {NextConfig} from 'next';
import path from 'path';

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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'firebase/firestore': path.resolve(process.cwd(), 'src/lib/stubs/no-client-firestore.ts'),
        '@firebase/firestore': path.resolve(process.cwd(), 'src/lib/stubs/no-client-firestore.ts'),
        'firebase/app': path.resolve(process.cwd(), 'src/lib/stubs/no-client-firestore.ts'),
      };
    }
    return config;
  },
};

export default nextConfig;
