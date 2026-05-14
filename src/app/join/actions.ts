"use server";

import { createClient } from "@/lib/supabase/server";

export type JoinRpcResult = {
  ok?: boolean;
  error?: string;
  already_member?: boolean;
};

export async function confirmJoinVendorAction(vendorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "not_authenticated" as const };
  }

  const { data, error } = await supabase.rpc("join_vendor_loyalty_program", {
    p_vendor_id: vendorId,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const payload = (data ?? {}) as JoinRpcResult;
  if (payload.ok === false) {
    return { ok: false as const, error: payload.error ?? "join_failed" };
  }

  return {
    ok: true as const,
    already_member: Boolean(payload.already_member),
  };
}
