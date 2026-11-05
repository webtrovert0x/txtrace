const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(@x402\/|@metamask\/connect-evm|mppx|accounts)/,
      })
    );

    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
      '@x402/svm/exact/client': false,
      '@x402/evm': false,
      '@metamask/connect-evm': false,
      'mppx/client': false,
      mppx: false,
      accounts: false,
    };

    return config;
  },
};

module.exports = nextConfig;
