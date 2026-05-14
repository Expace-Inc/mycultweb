import brandLogo from "@assets/brand/C.png";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logo file: `assets/brand/C.png` (replace placeholder with design master, e.g. 1080×1350). */
const LOGO_WIDTH = 1080;
const LOGO_HEIGHT = 1350;
const ASPECT = LOGO_WIDTH / LOGO_HEIGHT;

type BrandMarkProps = {
  /** Display height in pixels; width scales with logo aspect ratio. */
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandMark({
  size = 48,
  className,
  priority,
}: BrandMarkProps) {
  const h = size;
  const w = Math.max(1, Math.round(size * ASPECT));

  return (
    <Image
      src={brandLogo}
      alt="MyCult"
      width={w}
      height={h}
      className={cn("object-contain", className)}
      priority={priority}
    />
  );
}
