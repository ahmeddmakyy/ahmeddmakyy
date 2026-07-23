// ─────────────────────────────────────────────────────────────
// Every write the dashboard performs.
//
// There is no privileged key here and no server-side "admin" endpoint: the
// browser talks to Supabase with the same anon key as everyone else, and RLS
// decides what is allowed. A logged-out visitor calling any of this gets a
// permission error from Postgres, not from our code.
// ─────────────────────────────────────────────────────────────
import { browserClient } from "@/lib/supabase/client";

export type ReelRecord = {
  id: string;
  slug: string;
  sort_order: number;
  category: number;
  is_featured: boolean;
  is_published: boolean;
  video_url: string;
  poster_url: string | null;
  title_en: string;
  title_ar: string;
  tag_en: string;
  tag_ar: string;
  client_en: string;
  client_ar: string;
  description_en: string;
  description_ar: string;
  view_count: number;
  last_viewed_at: string | null;
};

export type WorkRecord = {
  id: string;
  sort_order: number;
  is_published: boolean;
  title: string;
  tag_en: string;
  tag_ar: string;
  period_en: string;
  period_ar: string;
  body_en: string;
  body_ar: string;
};

export type ServiceRecord = {
  id: string;
  sort_order: number;
  is_published: boolean;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
};

export const CATEGORY_LABELS = [
  "Cinematic AI Ads",
  "Motion Graphics & Type",
  "UI Animation",
] as const;

function db() {
  const sb = browserClient();
  if (!sb) throw new Error("Supabase is not configured — check VITE_SUPABASE_URL / _ANON_KEY.");
  return sb;
}

/** Turns a Postgres error into something readable rather than a raw code. */
function explain(error: { message: string; code?: string } | null): never | void {
  if (!error) return;
  if (error.code === "23505") throw new Error("That slug is already used by another reel.");
  if (error.code === "42501" || error.message.includes("row-level security"))
    throw new Error("This account is not an admin. Add it to public.admins first.");
  throw new Error(error.message);
}

// ── reels ────────────────────────────────────────────────────

/** Newest first — the same order the site shows within a category. */
export async function listReels(): Promise<ReelRecord[]> {
  const { data, error } = await db()
    .from("reels")
    .select("*")
    .order("sort_order", { ascending: false });
  explain(error);
  return (data ?? []) as ReelRecord[];
}

export async function createReel(
  input: Omit<ReelRecord, "id" | "sort_order" | "view_count" | "last_viewed_at">,
): Promise<void> {
  const sb = db();
  const { data: top } = await sb
    .from("reels")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = ((top?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  const { error } = await sb.from("reels").insert({ ...input, sort_order: nextOrder });
  explain(error);
}

export async function updateReel(id: string, patch: Partial<ReelRecord>): Promise<void> {
  const { error } = await db().from("reels").update(patch).eq("id", id);
  explain(error);
}

export async function deleteReel(id: string): Promise<void> {
  const { error } = await db().from("reels").delete().eq("id", id);
  explain(error);
}

/**
 * Only one reel may be featured (enforced by a unique index), so the previous
 * one has to be cleared first — otherwise the update fails.
 */
export async function setFeatured(id: string): Promise<void> {
  const sb = db();
  const { error: clearError } = await sb
    .from("reels")
    .update({ is_featured: false })
    .eq("is_featured", true);
  explain(clearError);

  const { error } = await sb.from("reels").update({ is_featured: true }).eq("id", id);
  explain(error);
}

/**
 * Swaps sort_order with the neighbour, so "up" in the dashboard is "earlier"
 * on the site. Two writes, because a swap through a unique-free integer column
 * has no single-statement form worth the complexity here.
 */
export async function swapOrder(a: ReelRecord, b: ReelRecord): Promise<void> {
  const sb = db();
  const { error: e1 } = await sb.from("reels").update({ sort_order: b.sort_order }).eq("id", a.id);
  explain(e1);
  const { error: e2 } = await sb.from("reels").update({ sort_order: a.sort_order }).eq("id", b.id);
  explain(e2);
}

/** Uploads a poster override and returns its public URL. */
export async function uploadPoster(file: File, slug: string): Promise<string> {
  const sb = db();
  const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
  // Cache-busting suffix: the CDN caches aggressively and a re-upload to the
  // same path would keep serving the old frame.
  const path = `${slug}-${Date.now()}.${ext}`;

  const { error } = await sb.storage
    .from("posters")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);

  return sb.storage.from("posters").getPublicUrl(path).data.publicUrl;
}

// ── work cards ───────────────────────────────────────────────

export async function listWork(): Promise<WorkRecord[]> {
  const { data, error } = await db()
    .from("work_cards")
    .select("*")
    .order("sort_order", { ascending: true });
  explain(error);
  return (data ?? []) as WorkRecord[];
}

export async function createWork(input: Omit<WorkRecord, "id" | "sort_order">): Promise<void> {
  const sb = db();
  const { data: top } = await sb
    .from("work_cards")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((top?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  const { error } = await sb.from("work_cards").insert({ ...input, sort_order: nextOrder });
  explain(error);
}

export async function updateWork(id: string, patch: Partial<WorkRecord>): Promise<void> {
  const { error } = await db().from("work_cards").update(patch).eq("id", id);
  explain(error);
}

export async function deleteWork(id: string): Promise<void> {
  const { error } = await db().from("work_cards").delete().eq("id", id);
  explain(error);
}

export async function swapWorkOrder(a: WorkRecord, b: WorkRecord): Promise<void> {
  const sb = db();
  const { error: e1 } = await sb
    .from("work_cards")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  explain(e1);
  const { error: e2 } = await sb
    .from("work_cards")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);
  explain(e2);
}

// ── services ─────────────────────────────────────────────────

export async function listServices(): Promise<ServiceRecord[]> {
  const { data, error } = await db()
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  explain(error);
  return (data ?? []) as ServiceRecord[];
}

export async function createService(
  input: Omit<ServiceRecord, "id" | "sort_order">,
): Promise<void> {
  const sb = db();
  const { data: top } = await sb
    .from("services")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = ((top?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  const { error } = await sb.from("services").insert({ ...input, sort_order: nextOrder });
  explain(error);
}

export async function updateService(id: string, patch: Partial<ServiceRecord>): Promise<void> {
  const { error } = await db().from("services").update(patch).eq("id", id);
  explain(error);
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await db().from("services").delete().eq("id", id);
  explain(error);
}

export async function swapServiceOrder(a: ServiceRecord, b: ServiceRecord): Promise<void> {
  const sb = db();
  const { error: e1 } = await sb
    .from("services")
    .update({ sort_order: b.sort_order })
    .eq("id", a.id);
  explain(e1);
  const { error: e2 } = await sb
    .from("services")
    .update({ sort_order: a.sort_order })
    .eq("id", b.id);
  explain(e2);
}
