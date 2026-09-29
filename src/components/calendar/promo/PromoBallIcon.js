// src/components/promo/PromoBallIcon.js
// "Lopta" ikonica za football temu — puni svoj krug, opciono se vrti za knockout faze.
// next/image: uploadovane ikonice su do 1024px, a prikazuju se dosta manje — Next pravi
// manju verziju po uređaju (sizes) umesto da šalje original.
import Image from "next/image";

export default function PromoBallIcon({
  src,
  spin = false,
  lazy = true,
  alt = "ball",
  sizes = "(min-width: 768px) 160px, 14vw",
}) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes={sizes}
      // Glavna lopta (LCP): eager + visok prioritet, ali bez <link preload> —
      // preload bi je skidao i na desktopu, gde je mobilni prikaz sakriven
      loading={lazy ? "lazy" : "eager"}
      fetchPriority={lazy ? undefined : "high"}
      className={`w-full h-full object-cover${spin ? " knockout-ball-spin" : ""}`}
    />
  );
}
