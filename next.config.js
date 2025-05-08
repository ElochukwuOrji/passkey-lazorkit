/** @type {import('next').NextConfig} */
module.exports = {
    reactStrictMode: true,
    experimental: {
      appDir: true, // For App Router
    },
    webpack: (config) => {
      config.resolve.fallback = { 
        ...config.resolve.fallback,
        buffer: require.resolve('buffer'),
        process: require.resolve('process'),
      };
      return config;
    }
  }