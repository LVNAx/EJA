/** @type {import('next').NextConfig} */
// NEXT_DIST_DIR memungkinkan build terpisah tanpa mengganggu `next dev` yang sedang berjalan.
const nextConfig = { reactStrictMode: true, distDir: process.env.NEXT_DIST_DIR || ".next" };
export default nextConfig;
