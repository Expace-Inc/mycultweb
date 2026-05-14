import { VirtualCardUpload } from "@/components/virtual-card-upload";
import { Card, CardTitle } from "@/components/ui/card";
import { VIRTUAL_CARD_SPEC_LABEL } from "@/lib/virtual-card-spec";
import Image from "next/image";
import Link from "next/link";

type Props = {
  vendorId: string;
  vendorName: string;
  virtualCardPath: string | null;
  virtualCardPublicUrl: string | null;
  canManage: boolean;
};

export function DashboardVirtualCard({
  vendorId,
  vendorName,
  virtualCardPath,
  virtualCardPublicUrl,
  canManage,
}: Props) {
  const hasCard = Boolean(virtualCardPath && virtualCardPublicUrl);

  return (
    <Card>
      <CardTitle className="mb-1">Virtual card</CardTitle>
      <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
        Members see this artwork as your programme card. Upload a full-bleed
        raster at exactly {VIRTUAL_CARD_SPEC_LABEL} (PNG, JPEG, or WebP, up to
        8&nbsp;MB).
      </p>

      {hasCard && virtualCardPublicUrl ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
          <div className="mx-auto w-full max-w-sm shrink-0 lg:mx-0">
            <div
              className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-forest)]/12 bg-[var(--color-mist)]/30 shadow-[0_8px_30px_rgb(20_54_48/0.12)]"
              style={{ aspectRatio: "1200 / 756" }}
            >
              <Image
                src={virtualCardPublicUrl}
                alt={`${vendorName} loyalty card design`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 384px"
                unoptimized
                priority
              />
            </div>
          </div>
          <div className="min-w-0 flex-1 flex flex-col gap-3">
            <p className="text-body-sm text-[var(--color-forest)]/80">
              This is the design shown to customers. Replace it anytime with a
              new file that matches the same pixel size.
            </p>
            {canManage ? (
              <VirtualCardUpload vendorId={vendorId} />
            ) : (
              <p className="text-body-sm text-[var(--color-forest)]/60">
                Ask an owner or manager if you need to change the card artwork.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--color-forest)]/25 bg-[var(--color-mist)]/25 px-4 py-6 text-center">
          <p className="text-body font-medium text-[var(--color-forest)]">
            No virtual card yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-body-sm text-[var(--color-forest)]/75">
            Create your card by exporting artwork at exactly {VIRTUAL_CARD_SPEC_LABEL},
            then upload it here. Set your design canvas to that size before you
            export so pixels match our checker.
          </p>
          {canManage ? (
            <div className="mt-5 flex flex-col items-center gap-3">
              <VirtualCardUpload vendorId={vendorId} />
              <p className="text-body-sm text-[var(--color-forest)]/60">
                Tip: duplicate your artboard to {VIRTUAL_CARD_SPEC_LABEL} before
                export — dimensions must match pixel-for-pixel.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-body-sm text-[var(--color-forest)]/60">
              An owner or manager must upload the card design. You can still
              review programme settings in{" "}
              <Link
                href="/settings/programme"
                className="font-semibold text-[var(--color-forest)] underline decoration-[var(--color-forest)]/30 underline-offset-2 hover:decoration-[var(--color-forest)]"
              >
                Points &amp; rules
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
