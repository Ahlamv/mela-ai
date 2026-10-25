import Image from "next/image";
import logo from "@/public/brand/mela-ai-logo-v1.png";

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-logo${compact ? " compact" : ""}`}>
    <Image src={logo} alt="Mela AI" sizes={compact ? "120px" : "180px"} loading="eager" />
  </span>;
}
