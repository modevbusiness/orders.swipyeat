import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/**" } as const]
        : []),
      { protocol: "https", hostname: "www.google.com", pathname: "/images/branding/**" },
    ],
  },
};

export default nextConfig;
