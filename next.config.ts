
import type {NextConfig} from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // Enable static export for live viewing
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for static export
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
  experimental: {
    turbo: {
      resolveAlias: {
        // Using relative paths for Turbopack aliases to avoid "server relative imports" error
        'async_hooks': './src/lib/shim.ts',
        'fs': './src/lib/shim.ts',
        'fs/promises': './src/lib/shim.ts',
        'path': './src/lib/shim.ts',
        'os': './src/lib/shim.ts',
        'crypto': './src/lib/shim.ts',
        'stream': './src/lib/shim.ts',
        'vm': './src/lib/shim.ts',
        'net': './src/lib/shim.ts',
        'tls': './src/lib/shim.ts',
        'child_process': './src/lib/shim.ts',
        'dns': './src/lib/shim.ts',
        'http': './src/lib/shim.ts',
        'https': './src/lib/shim.ts',
        'zlib': './src/lib/shim.ts',
        'dgram': './src/lib/shim.ts',
        'http2': './src/lib/shim.ts',
        'express': './src/lib/shim.ts',
        'get-port': './src/lib/shim.ts',
        'util': './src/lib/shim.ts',
        'buffer': './src/lib/shim.ts',
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes Webpack errors for npm packages that depend on Node.js modules for client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        fs: false,
        'fs/promises': false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        http2: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        http: false,
        https: false,
        zlib: false,
        vm: false,
        dgram: false,
      };
      
      // Absolute path resolution for Webpack aliases
      const shimPath = path.resolve(process.cwd(), 'src/lib/shim.ts');
      config.resolve.alias = {
        ...config.resolve.alias,
        'async_hooks': shimPath,
        'crypto': shimPath,
        'dgram': shimPath,
        'fs/promises': shimPath,
        'http2': shimPath,
        'path': shimPath,
        'fs': shimPath,
        'os': shimPath,
        'express': shimPath,
        'get-port': shimPath,
      };
    }
    return config;
  },
};

export default nextConfig;
