"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoUpload({
  vendorId,
  disabled,
}: {
  vendorId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    "idle",
  );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || disabled) return;

    setStatus("uploading");
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${vendorId}/logo-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("vendor-logos")
      .upload(path, file, { upsert: true });

    if (upErr) {
      setStatus("error");
      return;
    }

    const { error: dbErr } = await supabase
      .from("vendors")
      .update({ logo_path: path })
      .eq("id", vendorId);

    if (dbErr) {
      setStatus("error");
      return;
    }

    setStatus("done");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        disabled={disabled || status === "uploading"}
        onChange={onFile}
        className="text-body-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-forest)] file:px-3 file:py-2 file:text-label file:font-semibold file:text-white hover:file:opacity-90"
      />
      {status === "uploading" && (
        <p className="text-body-sm text-[var(--color-forest)]/70">Uploading…</p>
      )}
      {status === "done" && (
        <p className="text-body-sm text-green-800">Logo updated.</p>
      )}
      {status === "error" && (
        <p className="text-body-sm text-red-800">
          Upload failed. Check file type and try again.
        </p>
      )}
      {disabled && (
        <p className="text-body-sm text-[var(--color-forest)]/60">
          Only owners and managers can upload a logo.
        </p>
      )}
    </div>
  );
}
