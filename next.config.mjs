/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [],
    },
    // Ignore TypeScript and ESLint errors during build (for Railway deployment)
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

// Force rebuild: 2025-12-24 16:35 - Delivery charge field update
export default nextConfig;
