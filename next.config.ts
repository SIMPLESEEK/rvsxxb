import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产环境优化配置
  typescript: {
    ignoreBuildErrors: false, // 生产环境启用TypeScript检查
  },
  eslint: {
    ignoreDuringBuilds: false, // 生产环境启用ESLint检查
  },
  // 性能优化
  experimental: {
    // optimizeCss 需要额外依赖，暂时禁用
  },
  // 压缩配置
  compress: true,
  // 静态文件配置
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  // 图片优化配置
  images: {
    domains: ['xxb-1301676052.cos.ap-guangzhou.myqcloud.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.myqcloud.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
