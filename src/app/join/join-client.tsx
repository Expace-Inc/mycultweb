"use client";

import { confirmJoinVendorAction } from "@/app/join/actions";
import { BrandMark } from "@/components/auth/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { JOIN_VENDOR_QUERY_KEY } from "@/lib/join-url";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type JoinSnapshotOk = {
  ok: true;
  vendor_id: string;
  vendor_name: string;
  programme_name: string | null;
  points_name: string | null;
  programme_active: boolean;
  has_programme: boolean;
  virtual_card_path: string | null;
};

type Props = {
  snapshot: JoinSnapshotOk;
  initialUser: User | null;
};

export function JoinClient({ snapshot, initialUser }: Props) {
  const router = useRouter();
  const user = initialUser;
  const [phase, setPhase] = useState<"prompt" | "joining" | "done" | "error">(
    "prompt",
  );
  const [error, setError] = useState<string | null>(null);

  const loginNext = useMemo(() => {
    const path = `/join?${JOIN_VENDOR_QUERY_KEY}=${encodeURIComponent(snapshot.vendor_id)}`;
    return `/login?next=${encodeURIComponent(path)}`;
  }, [snapshot.vendor_id]);

  const cardUrl =
    snapshot.virtual_card_path && process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-virtual-cards/${snapshot.virtual_card_path}`
      : null;

  async function onConfirmJoin() {
    setPhase("joining");
    setError(null);
    const res = await confirmJoinVendorAction(snapshot.vendor_id);
    if (!res.ok) {
      if (res.error === "not_authenticated") {
        setPhase("prompt");
        router.push(loginNext);
        return;
      }
      setPhase("error");
      setError(
        res.error === "staff_cannot_join_own_vendor"
          ? "Staff accounts for this business cannot join as a member. Use a personal account, or ask your owner for a test member login."
          : typeof res.error === "string"
            ? res.error
            : "Something went wrong.",
      );
      return;
    }
    setPhase("done");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <BrandMark size={40} className="mx-auto" />
        <p className="mt-3 text-label font-semibold uppercase tracking-wide text-[var(--color-forest)]/55">
          MyCult loyalty
        </p>
        <h1 className="mt-2 text-display text-[var(--color-forest)]">
          {snapshot.vendor_name}
        </h1>
        {snapshot.has_programme ? (
          <p className="mt-2 text-body text-[var(--color-forest)]/75">
            Join their programme
            {snapshot.programme_name ? (
              <>
                : <span className="font-semibold">{snapshot.programme_name}</span>
              </>
            ) : null}{" "}
            and save their card to your wallet in the MyCult app after you join.
          </p>
        ) : (
          <p className="mt-2 text-body text-[var(--color-forest)]/75">
            This business has not finished programme setup yet. You can still
            follow the link again later.
          </p>
        )}
      </div>

      {phase === "done" ? (
        <Card className="border-[var(--color-forest)]/12">
          <CardTitle className="mb-3 text-center text-[var(--color-forest)]">
            You&apos;re in
          </CardTitle>
          <p className="text-center text-body-sm text-[var(--color-forest)]/75">
            Your account is linked to {snapshot.vendor_name}. Open the MyCult
            consumer app and sign in with the same email — your virtual card
            will appear in the wallet tab.
          </p>
          {cardUrl ? (
            <div
              className="relative mx-auto mt-6 w-full max-w-sm overflow-hidden rounded-2xl border border-[var(--color-forest)]/12 shadow-lg"
              style={{ aspectRatio: "1200 / 756" }}
            >
              <Image
                src={cardUrl}
                alt={`${snapshot.vendor_name} card`}
                fill
                className="object-cover"
                sizes="384px"
                unoptimized
              />
            </div>
          ) : (
            <p className="mt-4 text-center text-body-sm text-[var(--color-forest)]/60">
              Card artwork will appear once this business uploads a virtual card
              design.
            </p>
          )}
        </Card>
      ) : (
        <Card className="border-[var(--color-forest)]/12">
          {phase === "prompt" && (
            <>
              <CardTitle className="mb-3">Join this programme?</CardTitle>
              <p className="text-body-sm text-[var(--color-forest)]/75">
                We&apos;ll save your membership for{" "}
                <span className="font-semibold">{snapshot.vendor_name}</span> so
                visits and rewards stay under one profile. You can use the same
                login in the consumer app to see your card and balance.
              </p>
              {!snapshot.programme_active && snapshot.has_programme && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-body-sm text-amber-900">
                  Note: this programme is paused — points may not accrue until
                  the business turns it back on.
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                {user ? (
                  <>
                    <p className="text-body-sm text-[var(--color-forest)]/65">
                      Signed in as{" "}
                      <span className="font-medium text-[var(--color-forest)]">
                        {user.email}
                      </span>
                    </p>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => void onConfirmJoin()}
                    >
                      Confirm and join
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => router.push(loginNext)}
                    >
                      Sign in to join
                    </Button>
                    <p className="text-center text-body-sm text-[var(--color-forest)]/60">
                      New here? After sign-in you&apos;ll return to this page to
                      confirm. From the login screen you can create an account;
                      choose <span className="font-medium">Sign up</span> if you
                      don&apos;t have one yet.
                    </p>
                    <Link
                      href={`/login?next=${encodeURIComponent(`/join?${JOIN_VENDOR_QUERY_KEY}=${snapshot.vendor_id}`)}&mode=signup`}
                      className="text-center text-body-sm font-semibold text-[var(--color-forest)] underline decoration-[var(--color-forest)]/25 underline-offset-2"
                    >
                      Create account, then join
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
          {phase === "joining" && (
            <p className="py-8 text-center text-body-sm text-[var(--color-forest)]/70">
              Joining…
            </p>
          )}
          {phase === "error" && error && (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm text-red-800">{error}</p>
              <Button type="button" variant="secondary" onClick={() => setPhase("prompt")}>
                Try again
              </Button>
            </div>
          )}
        </Card>
      )}

    </div>
  );
}
