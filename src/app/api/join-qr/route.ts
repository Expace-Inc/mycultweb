import { createClient } from "@/lib/supabase/server";
import { buildJoinUrl } from "@/lib/join-url";
import { getSiteOrigin } from "@/lib/site-origin";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: staff } = await supabase
    .from("vendor_users")
    .select("vendor_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (
    !staff?.vendor_id ||
    (staff.role !== "owner" && staff.role !== "manager")
  ) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const joinUrl = buildJoinUrl(getSiteOrigin(), staff.vendor_id);

  const png = await QRCode.toBuffer(joinUrl, {
    type: "png",
    width: 512,
    margin: 2,
    color: { dark: "#143630ff", light: "#ffffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="mycult-join-qr.png"',
      "Cache-Control": "no-store",
    },
  });
}
