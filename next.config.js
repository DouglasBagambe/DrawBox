/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = {
  output: "standalone", // Ensures Next.js builds a self-contained app
  reactStrictMode: true,
  experimental: {
    appDir: false, // Disable app directory if it's confusing Netlify
  },
};
