/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pdfmake"],
  // Receipt photos are shrunk on the phone first; this leaves room for a PDF receipt.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // Old Bubble addresses: the app pages, and older marketing pages folded into the current ones.
  async redirects() {
    return [
      { source: "/index", destination: "/", permanent: true },
      { source: "/signup", destination: "/join", permanent: true },
      { source: "/knightingale", destination: "/login", permanent: false },
      { source: "/staffing", destination: "/care_organisations", permanent: true },
      { source: "/no_agency", destination: "/care_organisations", permanent: true },
      { source: "/graduates", destination: "/healthcare_professionals", permanent: true },
      { source: "/acu", destination: "/healthcare_professionals", permanent: true },
      { source: "/carers", destination: "/login", permanent: false }, // link in the carer welcome email
    ];
  },
  outputFileTracingIncludes: { "/**": ["./lib/pdf/fonts/**", "./lib/pdf/*.cjs"] },
};
export default nextConfig;
