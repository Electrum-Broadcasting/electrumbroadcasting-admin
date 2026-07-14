/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        process.env.CODESPACE_NAME
          ? `${process.env.CODESPACE_NAME}-3000.app.github.dev`
          : "",
        process.env.CODESPACE_NAME
          ? `${process.env.CODESPACE_NAME}-3001.app.github.dev`
          : ""
      ]
    }
  }
};

export default nextConfig;
