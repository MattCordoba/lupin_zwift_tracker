const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: [
    "@lupin/config",
    "@lupin/core",
    "@lupin/data",
    "@lupin/types",
    "@lupin/ui"
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "react-native$": "react-native-web"
    };
    return config;
  }
};

export default nextConfig;
