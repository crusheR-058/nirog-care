"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Loader2,
  Download,
  Trash2,
  FolderLock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const BUCKET = "patient-documents";

interface DocFile {
  name: string;
  id: string | null;
  size?: number;
  createdAt?: string;
}

function prettySize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Patient document locker backed by Supabase Storage. Reads/writes run as the
 * signed-in doctor, so Storage RLS only exposes files for accessible patients.
 * Files live at patient-documents/<patientId>/<name>.
 */
export function PatientDocuments({ patientId }: { patientId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(patientId, { sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setFiles(
        (data ?? [])
          .filter((f) => f.name !== ".emptyFolderPlaceholder")
          .map((f) => ({
            name: f.name,
            id: f.id,
            size: (f.metadata as { size?: number } | null)?.size,
            createdAt: f.created_at ?? undefined,
          }))
      );
    }
    setLoading(false);
  }, [supabase, patientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const path = `${patientId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) setError(error.message);
    await refresh();
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function open(name: string) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${patientId}/${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function remove(name: string) {
    await supabase.storage.from(BUCKET).remove([`${patientId}/${name}`]);
    await refresh();
  }

  return (
    <section className="rounded-2xl border border-hairline bg-panel p-5 shadow-quiet">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-soft-indigo text-indigo">
            <FolderLock className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold text-ink">Documents</h2>
            <p className="text-xs text-ink-faint">
              Encrypted · consent-scoped · signed links
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="hidden"
          onChange={onUpload}
        />
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-soft-red px-3 py-2 text-xs text-red">
          {error}
        </p>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-ink-faint">
          <Loader2 className="mx-auto size-4 animate-spin" />
        </p>
      ) : files.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline-strong bg-panel-2 py-8 text-center">
          <FileText className="mx-auto size-6 text-ink-faint" />
          <p className="mt-2 text-sm font-medium text-ink">No documents yet</p>
          <p className="text-xs text-ink-soft">
            Upload lab reports, scans or referral letters.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li
              key={f.name}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-panel-2 p-2.5"
            >
              <span className="grid size-9 place-items-center rounded-lg bg-soft-blue text-blue">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {f.name.replace(/^\d+-/, "")}
                </p>
                <p className="text-xs text-ink-faint">{prettySize(f.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => open(f.name)}
                className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-secondary hover:text-blue"
                aria-label="Open document"
              >
                <Download className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(f.name)}
                className="grid size-8 place-items-center rounded-lg text-ink-faint hover:bg-soft-red hover:text-red"
                aria-label="Delete document"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
