/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server build, used by packaging/build-deb.sh
  output: "standalone",
};

export default nextConfig;
