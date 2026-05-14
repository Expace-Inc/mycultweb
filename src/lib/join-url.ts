export function normalizeSiteOrigin(raw: string) {
  return raw.replace(/\/$/, "");
}

export function buildJoinUrl(siteOrigin: string, vendorId: string) {
  return `${normalizeSiteOrigin(siteOrigin)}/join?v=${vendorId}`;
}

export const JOIN_VENDOR_QUERY_KEY = "v";
