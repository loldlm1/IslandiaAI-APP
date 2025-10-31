import type { NextConfig } from "next";

const devOrigins =
  process.env.NODE_ENV === "development" ? ["127.0.0.1"] : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  images: {
    // Disable Next.js image optimization so dev server doesn't require sharp,
    // which is currently unavailable in this environment.
    unoptimized: true,
  },
  webpack(config, { isServer }) {
    // Only configure SVG handling for client-side builds
    // SVGs from public folder are served as static assets by Next.js automatically
    if (!isServer) {
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] },
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              svgo: false,
              titleProp: true,
            },
          },
        ],
      });
    }

    return config;
  },
};

export default nextConfig;
