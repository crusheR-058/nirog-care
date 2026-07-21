"use client";

import { useState } from "react";
import { UploadCloud, Check, Loader2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Uploads to <bucket>/<ownerId>/<key>-… and reports back the stored path.
 *  Shared by the doctor and pharmacy verification wizards. */
export function UploadField({
  ownerId,
  bucket = "doctor-documents",
  storageKey,
  label,
  hint,
  required,
  value,
  onChange,
}: {
  ownerId: string;
  bucket?: string;
  storageKey: string;
  label: string;
  hint?: string;
  required?: boolean;
  value?: string;
  onChange: (path: string | undefined) => void;
}) {
  const [supabase] = useState(() => createClient());
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(
    value ? value.split("/").pop() ?? "Uploaded" : null
  );
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${ownerId}/${storageKey}-${Date.now()}-${safe}`;
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (error) {
      setError(error.message);
    } else {
      setFileName(file.name);
      onChange(path);
    }
    setUploading(false);
  }

  const done = !!value && !uploading;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-red">*</span>}
      </label>
      {hint && <p className="-mt-1 text-xs text-ink-faint">{hint}</p>}
      <label
        className={cn(
          "flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed px-3.5 py-2.5 text-sm transition-colors",
          done
            ? "border-green/40 bg-soft-green"
            : "border-hairline-strong bg-panel-2 hover:border-blue hover:bg-soft-blue/40"
        )}
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg",
            done ? "bg-green/15 text-green" : "bg-soft-blue text-blue"
          )}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : done ? (
            <Check className="size-4" />
          ) : (
            <UploadCloud className="size-4" />
          )}
        </span>
        <span className="min-w-0 flex-1 truncate">
          {uploading ? (
            <span className="text-ink-soft">Uploading…</span>
          ) : done ? (
            <span className="inline-flex items-center gap-1.5 text-ink">
              <FileText className="size-3.5 text-ink-faint" />
              {fileName}
            </span>
          ) : (
            <span className="font-medium text-ink">Upload file</span>
          )}
        </span>
        {done && <span className="text-xs font-medium text-green">Replace</span>}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={onFile}
        />
      </label>
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
