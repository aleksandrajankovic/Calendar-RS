/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Optimizovane (smanjene) verzije slika se keširaju godinu dana — /uploads/
    // imena su hash-ovana po sadržaju, pa nova slika uvek dobija novo ime.
    minimumCacheTTL: 31536000,
    // Podrazumevane veličine + 448/512/576: lopta na telefonu je ~450–560px
    // (68–72vw × DPR), bez ovoga bi se skidala verzija od 640px.
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 448, 512, 576],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-XSS-Protection",          value: "1; mode=block" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // /uploads/ fajlovi su hash-ovani po sadržaju (upload/route.js) — isto ime
        // uvek znači isti sadržaj, pa je bezbedno agresivno i trajno keširati.
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
