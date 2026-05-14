"use client";

import { createClient } from "@/lib/supabase/client";
import {
  VIRTUAL_CARD_BUCKET,
  VIRTUAL_CARD_DESIGN_HEIGHT,
  VIRTUAL_CARD_DESIGN_WIDTH,
  VIRTUAL_CARD_SPEC_LABEL,
} from "@/lib/virtual-card-spec";
import { useRouter } from "next/navigation";
import { useState } from "react";

function extFromMime(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  return "png";
}

async function readImagePixelSize(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.close();
    return { width: w, height: h };
  } catch {
    return null;
  }
}

export function VirtualCardUpload({
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
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;

    setMessage(null);
    setStatus("idle");

    const dims = await readImagePixelSize(file);
    if (!dims) {
      setStatus("error");
      setMessage("Could not read this image. Use PNG, JPEG, or WebP.");
      return;
    }
    if (
      dims.width !== VIRTUAL_CARD_DESIGN_WIDTH ||
      dims.height !== VIRTUAL_CARD_DESIGN_HEIGHT
    ) {
      setStatus("error");
      setMessage(
        `Image is ${dims.width} × ${dims.height} px. Required exactly ${VIRTUAL_CARD_SPEC_LABEL}.`,
      );
      return;
    }

    setStatus("uploading");
    const supabase = createClient();
    const ext = extFromMime(file.type) || (file.name.split(".").pop() ?? "png");
    const path = `${vendorId}/virtual-card-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(VIRTUAL_CARD_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setStatus("error");
      setMessage("Upload failed. Try again or use a smaller file.");
      return;
    }

    const { error: dbErr } = await supabase
      .from("vendors")
      .update({ virtual_card_path: path })
      .eq("id", vendorId);

    if (dbErr) {
      setStatus("error");
      setMessage("Saved file but could not update profile. Try again.");
      return;
    }

    setStatus("done");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled || status === "uploading"}
        onChange={onFile}
        className="text-body-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-forest)] file:px-3 file:py-2 file:text-label file:font-semibold file:text-white hover:file:opacity-90"
      />
      {status === "uploading" && (
        <p className="text-body-sm text-[var(--color-forest)]/70">Uploading…</p>
      )}
      {status === "done" && (
        <p className="text-body-sm text-green-800">Virtual card design saved.</p>
      )}
      {status === "error" && message && (
        <p className="text-body-sm text-red-800">{message}</p>
      )}
      {disabled && (
        <p className="text-body-sm text-[var(--color-forest)]/60">
          Only owners and managers can upload the virtual card design.
        </p>
      )}
    </div>
  );
}
