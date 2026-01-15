import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export", // Penting untuk GitHub Pages
  images: {
    unoptimized: true, // GitHub Pages tidak punya Image Optimization server
  },
  reactCompiler: true,
};

export default nextConfig;
