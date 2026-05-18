/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: [
        "localhost:3000",
        process.env.CODESPACE_NAME
          ? `${process.env.CODESPACE_NAME}-3000.app.github.dev`
          : ""
      ]
    }
  }
};

export default nextConfig;
