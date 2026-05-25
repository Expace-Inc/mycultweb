/** Public MyCult operator site (no trailing slash). */
export const PUBLIC_SITE_ORIGIN = "https://www.my-cult.com";

export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return fromEnv || PUBLIC_SITE_ORIGIN;
}
