/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["tempo-devtools"],
    esmExternals: "loose",
  },
  webpack: (config, { isServer, dev }) => {
    // Exclude Supabase functions from webpack compilation
    config.externals = config.externals || [];
    config.externals.push({
      "supabase/functions": "commonjs supabase/functions",
    });

    // Ignore Supabase functions directory in webpack
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/supabase/functions/**"],
    };

    // Fix module resolution issues for both client and server
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        os: false,
        assert: false,
        constants: false,
        _stream_duplex: false,
        _stream_passthrough: false,
        _stream_readable: false,
        _stream_transform: false,
        _stream_writable: false,
        dgram: false,
        dns: false,
        events: false,
        http2: false,
        cluster: false,
        readline: false,
        repl: false,
        tty: false,
        child_process: false,
        worker_threads: false,
      };
    }

    // Simplify optimization to avoid bundling issues
    config.optimization = {
      ...config.optimization,
      splitChunks: false,
      runtimeChunk: false,
    };

    // Ensure API routes are properly handled
    if (isServer) {
      config.externals = [...config.externals, "canvas", "jsdom"];
    }

    // Fix for API route compilation issues
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "src"),
    };

    // Remove custom ts-loader rule as Next.js handles TypeScript compilation

    return config;
  },
  // Remove standalone output as it can cause issues with API routes
  // output: "standalone",
  // Add proper handling for API routes
  async rewrites() {
    return [];
  },
  // Ensure TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
  // Ensure proper build configuration
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

module.exports = nextConfig;
