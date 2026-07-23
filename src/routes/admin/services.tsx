import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Bilingual, Toggle } from "@/components/admin/Fields";
import {
  createService,
  deleteService,
  listServices,
  swapServiceOrder,
  updateService,
  type ServiceRecord,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/services")({ component: ServicesPage });

type Draft = Omit<ServiceRecord, "id" | "sort_order">;

const EMPTY: Draft = {
  is_published: true,
  title_en: "",
  title_ar: "",
  body_en: "",
  body_ar: "",
};

function ServicesPage() {
  const [rows, setRows] = useState<ServiceRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  const refresh = useCallback(async () => {
    try {
      setRows(await listServices());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load services.");
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

  if (error && !rows) return <p className="adm-error">{error}</p>;
  if (!rows) return <p className="adm-empty">Loading…</p>;

  return (
    <>
      {error && <p className="adm-error">{error}</p>}

      <p className="adm-note">
        The Services section is a three-card row by design — adding a fourth changes that layout, so
        keep it to three unless you want the row to wrap.
      </p>

      <div className="adm-actions" style={{ marginTop: 0, marginBottom: "1.25rem" }}>
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={() => setEditing(editing === "new" ? null : "new")}
        >
          {editing === "new" ? "Cancel" : "+ Add service"}
        </button>
        <span className="adm-who">{rows.length} services</span>
      </div>

      {editing === "new" && (
        <ServiceForm
          initial={EMPTY}
          onCancel={() => setEditing(null)}
          onSave={async (d) => {
            await run(() => createService(d));
            setEditing(null);
          }}
        />
      )}

      {rows.map((row, i) => (
        <div key={row.id} className="adm-card">
          <div className="adm-card-head">
            <div style={{ marginInlineEnd: "auto", minWidth: "10rem" }}>
              <div className="adm-card-title">{row.title_en || "(untitled)"}</div>
              <div
                style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.5rem" }}
              >
                {!row.is_published && <span className="adm-badge adm-badge--hidden">Hidden</span>}
                {!row.body_ar.trim() && (
                  <span className="adm-badge adm-badge--warn">No Arabic</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="adm-btn adm-btn--icon"
                title="Move up"
                disabled={i === 0}
                onClick={() => void run(() => swapServiceOrder(row, rows[i - 1]))}
              >
                ↑
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--icon"
                title="Move down"
                disabled={i === rows.length - 1}
                onClick={() => void run(() => swapServiceOrder(row, rows[i + 1]))}
              >
                ↓
              </button>
              <button
                type="button"
                className="adm-btn"
                onClick={() => setEditing(editing === row.id ? null : row.id)}
              >
                {editing === row.id ? "Close" : "Edit"}
              </button>
            </div>
          </div>

          {editing === row.id && (
            <ServiceForm
              initial={row}
              isEdit
              onCancel={() => setEditing(null)}
              onSave={async (d) => {
                await run(() => updateService(row.id, d));
                setEditing(null);
              }}
              onDelete={async () => {
                if (!window.confirm(`Delete "${row.title_en}" permanently?`)) return;
                await run(() => deleteService(row.id));
                setEditing(null);
              }}
            />
          )}
        </div>
      ))}
    </>
  );
}

function ServiceForm({
  initial,
  isEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Draft;
  isEdit?: boolean;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await onSave(d);
    } finally {
      setBusy(false);
    }
  };

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
        label="Body"
        en={d.body_en}
        ar={d.body_ar}
        onEn={(v) => set("body_en", v)}
        onAr={(v) => set("body_ar", v)}
        multiline
      />

      <Toggle
        label="Published (visible on the site)"
        checked={d.is_published}
        onChange={(v) => set("is_published", v)}
      />

      <div className="adm-actions">
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          disabled={busy || !d.title_en.trim()}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create service"}
        </button>
        <button type="button" className="adm-btn" onClick={onCancel}>
          Cancel
        </button>
        {onDelete && (
          <button type="button" className="adm-btn adm-btn--danger" onClick={() => void onDelete()}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
