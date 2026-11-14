/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfmake"],
  // Receipt photos are shrunk on the phone first; this leaves room for a PDF receipt.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  outputFileTracingIncludes: { "/**": ["./lib/pdf/fonts/**", "./lib/pdf/*.cjs"] },
};
export default nextConfig;
