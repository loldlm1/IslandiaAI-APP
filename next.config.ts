import type { NextConfig } from "next";

const devOrigins =
  process.env.NODE_ENV === "development" ? ["127.0.0.1"] : undefined;

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
  webpack(config) {
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

    return config;
  },
};

export default nextConfig;
