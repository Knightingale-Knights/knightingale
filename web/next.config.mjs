/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfmake"],
  outputFileTracingIncludes: { "/**": ["./lib/pdf/fonts/**", "./lib/pdf/*.cjs"] },
};
export default nextConfig;
