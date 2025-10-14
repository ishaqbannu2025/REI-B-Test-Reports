import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Note: removed `output: 'export'` so Next can server-render dynamic routes and preserve API routes.
     Keep other options below. If you intentionally need a fully static export, we can revert and
     adjust the app to not rely on API routes or runtime server rendering. */
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
};

export default nextConfig;
