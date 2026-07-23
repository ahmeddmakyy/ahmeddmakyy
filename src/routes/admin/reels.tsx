import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Bilingual, Field, TextInput, Toggle } from "@/components/admin/Fields";
import { resolvePoster } from "@/lib/site-data";
import {
  CATEGORY_LABELS,
  createReel,
  deleteReel,
  listReels,
  setFeatured,
  swapOrder,
  updateReel,
  uploadPoster,
  type ReelRecord,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/reels")({ component: ReelsPage });

type Draft = Omit<ReelRecord, "id" | "sort_order" | "view_count" | "last_viewed_at">;

const EMPTY: Draft = {
  slug: "",
  category: 0,
  is_featured: false,
  is_published: true,
  video_url: "",
  poster_url: null,
  title_en: "",
  title_ar: "",
  tag_en: "",
  tag_ar: "",
  client_en: "",
  client_ar: "",
  description_en: "",
  description_ar: "",
};

/** "Trust Motors — Summer Trip" → "trust-motors-summer-trip" */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function ReelsPage() {
  const [reels, setReels] = useState<ReelRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const refresh = useCallback(async () => {
    try {
      setReels(await listReels());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load reels.");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  if (error && !reels) return <p className="adm-error">{error}</p>;
  if (!reels) return <p className="adm-empty">Loading…</p>;

  return (
    <>
      {error && <p className="adm-error">{error}</p>}

      <div className="adm-actions" style={{ marginTop: 0, marginBottom: "1.25rem" }}>
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={() => setEditing(editing === "new" ? null : "new")}
        >
          {editing === "new" ? "Cancel" : "+ Add reel"}
        </button>
        <span className="adm-who">
          {reels.length} reels · {reels.filter((r) => !r.is_published).length} hidden
        </span>
      </div>

      {editing === "new" && (
        <ReelForm
          initial={EMPTY}
          onCancel={() => setEditing(null)}
          onSave={async (draft) => {
            await run(() => createReel(draft));
            setEditing(null);
          }}
        />
      )}

      {reels.length === 0 && (
        <p className="adm-empty">No reels yet. The site is showing its built-in copy.</p>
      )}

      {reels.map((reel, i) => (
        <div key={reel.id} className="adm-card">
          <div className="adm-card-head">
            <img
              className="adm-poster"
              src={resolvePoster(reel.slug, reel.poster_url, reel.video_url)}
              alt=""
              loading="lazy"
            />
            <div style={{ marginInlineEnd: "auto", minWidth: "10rem" }}>
              <div className="adm-card-title">{reel.title_en || "(untitled)"}</div>
              <div className="adm-card-sub">
                {CATEGORY_LABELS[reel.category] ?? "?"} · {reel.slug} · {reel.view_count} views
              </div>
              <div
                style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.5rem" }}
              >
                {reel.is_featured && (
                  <span className="adm-badge adm-badge--featured">Featured</span>
                )}
                {!reel.is_published && <span className="adm-badge adm-badge--hidden">Hidden</span>}
                {!reel.title_ar.trim() && (
                  <span className="adm-badge adm-badge--warn">No Arabic</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="adm-btn adm-btn--icon"
                title="Move up (shows earlier on the site)"
                disabled={i === 0}
                onClick={() => void run(() => swapOrder(reel, reels[i - 1]))}
              >
                ↑
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--icon"
                title="Move down"
                disabled={i === reels.length - 1}
                onClick={() => void run(() => swapOrder(reel, reels[i + 1]))}
              >
                ↓
              </button>
              <button
                type="button"
                className="adm-btn"
                onClick={() => setEditing(editing === reel.id ? null : reel.id)}
              >
                {editing === reel.id ? "Close" : "Edit"}
              </button>
            </div>
          </div>

          {editing === reel.id && (
            <ReelForm
              initial={reel}
              existing={reel}
              onCancel={() => setEditing(null)}
              onSave={async (draft) => {
                await run(() => updateReel(reel.id, draft));
                setEditing(null);
              }}
              onDelete={async () => {
                if (!window.confirm(`Delete "${reel.title_en}" permanently?`)) return;
                await run(() => deleteReel(reel.id));
                setEditing(null);
              }}
              onFeature={() => void run(() => setFeatured(reel.id))}
            />
          )}
        </div>
      ))}
    </>
  );
}

function ReelForm({
  initial,
  existing,
  onSave,
  onCancel,
  onDelete,
  onFeature,
}: {
  initial: Draft;
  existing?: ReelRecord;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  onFeature?: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await onSave({ ...d, slug: d.slug.trim() || slugify(d.title_en) });
    } finally {
      setBusy(false);
    }
  };

  const pickPoster = async (file: File) => {
    setUploadError(null);
    setBusy(true);
    try {
      const url = await uploadPoster(file, d.slug.trim() || slugify(d.title_en) || "reel");
      set("poster_url", url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const canSave = d.title_en.trim() && d.video_url.trim();

  return (
    <div
      style={{
        marginTop: "1.125rem",
        paddingTop: "1.125rem",
        borderTop: "2px solid var(--line-light)",
      }}
    >
      <Bilingual
        label="Title"
        en={d.title_en}
        ar={d.title_ar}
        onEn={(v) => set("title_en", v)}
        onAr={(v) => set("title_ar", v)}
      />
      <Bilingual
        label="Tag (the small label on the card)"
        en={d.tag_en}
        ar={d.tag_ar}
        onEn={(v) => set("tag_en", v)}
        onAr={(v) => set("tag_ar", v)}
        placeholder="AI Ad"
      />
      <Bilingual
        label="Client"
        en={d.client_en}
        ar={d.client_ar}
        onEn={(v) => set("client_en", v)}
        onAr={(v) => set("client_ar", v)}
        placeholder="Car Dealership · Cairo"
      />
      <Bilingual
        label="Description"
        en={d.description_en}
        ar={d.description_ar}
        onEn={(v) => set("description_en", v)}
        onAr={(v) => set("description_ar", v)}
        multiline
      />

      <Field label="Video URL (Cloudinary mp4)">
        <TextInput
          value={d.video_url}
          onChange={(v) => set("video_url", v)}
          placeholder="https://res.cloudinary.com/ahmedmakyy/video/upload/v.../clip.mp4"
        />
      </Field>

      <div className="adm-row2">
        <Field
          label="Slug (the ?v= link)"
          hint={!d.slug.trim() ? `Will be generated: ${slugify(d.title_en) || "—"}` : undefined}
        >
          <TextInput value={d.slug} onChange={(v) => set("slug", v)} placeholder="auto" />
        </Field>

        <Field label="Category">
          <select
            className="adm-select"
            value={d.category}
            onChange={(e) => set("category", Number(e.target.value))}
          >
            {CATEGORY_LABELS.map((label, i) => (
              <option key={label} value={i}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Poster"
        hint="Leave empty and a sharp frame is pulled from the video automatically. Upload only to pick a different frame."
      >
        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center", flexWrap: "wrap" }}>
          <img
            className="adm-poster"
            src={resolvePoster(d.slug, d.poster_url, d.video_url)}
            alt=""
          />
          <input
            type="file"
            accept="image/*"
            className="adm-input"
            style={{ maxWidth: "16rem" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickPoster(f);
            }}
          />
          {d.poster_url && (
            <button type="button" className="adm-btn" onClick={() => set("poster_url", null)}>
              Use auto frame
            </button>
          )}
        </div>
      </Field>
      {uploadError && <p className="adm-error">{uploadError}</p>}

      <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        <Toggle
          label="Published (visible on the site)"
          checked={d.is_published}
          onChange={(v) => set("is_published", v)}
        />
      </div>

      <div className="adm-actions">
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          disabled={busy || !canSave}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : existing ? "Save changes" : "Create reel"}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
        {onFeature && !existing?.is_featured && (
          <button type="button" className="adm-btn" onClick={onFeature}>
            Make featured
          </button>
        )}
        {onDelete && (
          <button type="button" className="adm-btn adm-btn--danger" onClick={() => void onDelete()}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
