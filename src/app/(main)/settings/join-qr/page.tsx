import { createClient } from "@/lib/supabase/server";
import { buildJoinUrl } from "@/lib/join-url";
import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

const downloadBtnClass = cn(
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-label font-semibold tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember)] border border-[var(--color-forest)]/20 bg-white text-[var(--color-forest)] hover:bg-[var(--color-mist)]/40",
);

export default async function JoinQrSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("vendor_users")
    .select("vendor_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!staff?.vendor_id) {
    redirect("/setup");
  }

  const canManage = staff.role === "owner" || staff.role === "manager";

  const headerList = await headers();
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const inferredOrigin =
    host && !host.includes("localhost")
      ? `${proto}://${host}`
      : "http://localhost:3000";
  const siteOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? inferredOrigin;
  const joinUrl = buildJoinUrl(siteOrigin, staff.vendor_id);
  const qrSrc = "/api/join-qr";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Join QR</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Members scan this QR (or open the link) to see your programme, confirm
          they want to join, then save your virtual card in the MyCult consumer
          app wallet.
        </p>
      </div>

      {!canManage ? (
        <Card>
          <CardTitle className="mb-2">Owners and managers only</CardTitle>
          <p className="text-body-sm text-[var(--color-forest)]/75">
            Ask an owner or manager to download the join QR for your locations.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <Card>
              <CardTitle className="mb-4">QR code</CardTitle>
              <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
                Encodes your public join URL. Print for tables, receipts, or
                window stickers. The consumer app can scan the same code.
              </p>
              <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl border border-[var(--color-forest)]/12 bg-white p-3 shadow-sm">
                <Image
                  src={qrSrc}
                  alt="QR code to join this loyalty programme"
                  fill
                  className="object-contain p-2"
                  sizes="280px"
                  unoptimized
                  priority
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={qrSrc} download="mycult-join-qr.png" className={downloadBtnClass}>
                  Download PNG
                </a>
              </div>
            </Card>

            <Card>
              <CardTitle className="mb-4">Join link</CardTitle>
              <p className="mb-3 text-body-sm text-[var(--color-forest)]/75">
                Use this HTTPS URL in the consumer app, SMS, or marketing. It
                opens a confirmation page before saving membership.
              </p>
              <div className="rounded-lg border border-[var(--color-forest)]/10 bg-[var(--color-mist)]/25 px-3 py-2 font-mono text-body-sm break-all text-[var(--color-forest)]/90">
                {joinUrl}
              </div>
              <p className="mt-4 text-body-sm text-[var(--color-forest)]/60">
                Set{" "}
                <code className="rounded bg-[var(--color-forest)]/8 px-1">
                  NEXT_PUBLIC_SITE_URL
                </code>{" "}
                in production so the QR matches your live domain.
              </p>
            </Card>
          </div>

          <Card>
            <CardTitle className="mb-3">How it works</CardTitle>
            <ol className="list-inside list-decimal space-y-2 text-body-sm text-[var(--color-forest)]/85">
              <li>Customer scans QR or taps the link.</li>
              <li>
                They review your business name and programme, then sign in (or
                create an account).
              </li>
              <li>
                After they confirm, we store a{" "}
                <span className="font-medium">membership</span> row for your
                vendor and their user — ready for the app wallet and earn flows.
              </li>
              <li>
                Your uploaded virtual card (Dashboard) is shown after a
                successful join so they know what appears in wallet.
              </li>
            </ol>
            <p className="mt-4 text-body-sm text-[var(--color-forest)]/60">
              Deep link from a native app: open the same URL in an in-app
              browser or system browser, then return to the app after join.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
