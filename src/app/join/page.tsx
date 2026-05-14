import { JoinClient, type JoinSnapshotOk } from "@/app/join/join-client";
import { Card, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isVendorId(v: string | undefined): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const { v } = await searchParams;

  if (!isVendorId(v)) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <Card>
          <CardTitle className="mb-2">Link not valid</CardTitle>
          <p className="text-body-sm text-[var(--color-forest)]/75">
            Ask the business for an updated QR or invite link. If you opened
            this from the MyCult app, try scanning again.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-body-sm font-semibold text-[var(--color-forest)] underline underline-offset-2"
          >
            Go to sign in
          </Link>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: snapRaw, error: rpcErr } = await supabase.rpc(
    "get_vendor_join_snapshot",
    { p_vendor_id: v },
  );

  if (rpcErr || !snapRaw || typeof snapRaw !== "object") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <Card>
          <CardTitle className="mb-2">Could not load programme</CardTitle>
          <p className="text-body-sm text-[var(--color-forest)]/75">
            Try again in a moment. If the problem continues, contact the
            business.
          </p>
        </Card>
      </div>
    );
  }

  const snapshot = snapRaw as Record<string, unknown>;
  if (snapshot.ok === false) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12">
        <Card>
          <CardTitle className="mb-2">Business not found</CardTitle>
          <p className="text-body-sm text-[var(--color-forest)]/75">
            This join link may be out of date.
          </p>
        </Card>
      </div>
    );
  }

  const normalized: JoinSnapshotOk = {
    ok: true,
    vendor_id: String(snapshot.vendor_id),
    vendor_name: String(snapshot.vendor_name ?? "Programme"),
    programme_name:
      snapshot.programme_name == null ? null : String(snapshot.programme_name),
    points_name:
      snapshot.points_name == null ? null : String(snapshot.points_name),
    programme_active: Boolean(snapshot.programme_active),
    has_programme: Boolean(snapshot.has_programme),
    virtual_card_path:
      snapshot.virtual_card_path == null
        ? null
        : String(snapshot.virtual_card_path),
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[var(--color-mist)]/20">
      <JoinClient snapshot={normalized} initialUser={user} />
    </div>
  );
}
