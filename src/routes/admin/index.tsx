import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { listReels, type ReelRecord } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/")({ component: Overview });

function Overview() {
  const [reels, setReels] = useState<ReelRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReels()
      .then(setReels)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load the dashboard."),
      );
  }, []);

  if (error) return <p className="adm-error">{error}</p>;
  if (!reels) return <p className="adm-empty">Loading…</p>;

  const published = reels.filter((r) => r.is_published);
  const totalViews = reels.reduce((sum, r) => sum + r.view_count, 0);
  const missingArabic = reels.filter((r) => !r.title_ar.trim() || !r.description_ar.trim());

  // Ranked by plays. The bar is scaled against the leader, so the shape of the
  // ranking is readable without any chart library.
  const ranked = [...reels].sort((a, b) => b.view_count - a.view_count);
  const top = ranked[0]?.view_count ?? 0;

  return (
    <>
      <div className="adm-stats">
        <div className="adm-stat">
          <div className="adm-stat-n">{totalViews.toLocaleString()}</div>
          <div className="adm-stat-l">Total plays</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-n">{published.length}</div>
          <div className="adm-stat-l">Live reels</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-n">{reels.length - published.length}</div>
          <div className="adm-stat-l">Hidden</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-n">{missingArabic.length}</div>
          <div className="adm-stat-l">Missing Arabic</div>
        </div>
      </div>

      {missingArabic.length > 0 && (
        <p className="adm-note">
          {missingArabic.length} reel{missingArabic.length === 1 ? "" : "s"} have no Arabic copy.
          The Arabic site falls back to the English text for those, which looks unfinished to an
          Arabic visitor.
        </p>
      )}

      <h2 className="adm-card-title" style={{ marginBottom: "0.75rem" }}>
        Most watched
      </h2>

      {totalViews === 0 ? (
        <p className="adm-empty">
          No plays counted yet. A view is recorded when someone actually opens a reel — not when the
          page loads.
        </p>
      ) : (
        <div className="adm-views">
          {ranked.map((r, i) => (
            <div key={r.id} className="adm-view-row">
              <span className="adm-view-rank">{i + 1}</span>
              <span className="adm-view-name">{r.title_en || r.slug}</span>
              <span
                className="adm-view-bar"
                style={{ width: `${top ? Math.max(4, (r.view_count / top) * 100) : 4}px` }}
                aria-hidden="true"
              />
              <span className="adm-view-n">{r.view_count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
