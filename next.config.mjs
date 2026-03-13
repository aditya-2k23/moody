/** @type {import('next').NextConfig} */
const skipNextValidation = process.env.SKIP_NEXT_VALIDATION === "1";

const nextConfig = {
  output: "standalone",

  experimental: {
    turbopackUseSystemTlsCerts: true,
  },

  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: skipNextValidation,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
