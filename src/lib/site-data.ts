// ─────────────────────────────────────────────────────────────
// The bridge between Supabase and the shape the site already renders.
//
// The public components were written against index-aligned arrays
// (CONTENT[lang].videos ↔ VIDEO_MEDIA ↔ VIDEO_GROUPS). That contract is
// kept exactly as-is — this module just rebuilds those arrays from the
// database instead of from hardcoded literals, so no rendering logic had
// to change.
//
// If Supabase is unconfigured, unreachable, or empty, everything falls
// back to src/content.ts. The portfolio renders identically either way.
// ─────────────────────────────────────────────────────────────
import { CONTENT, type Lang, type SiteContent } from "@/content";
import { VIDEO_MEDIA, type VideoMedia } from "@/video-media";
import { restSelect } from "@/lib/supabase/rest";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Category ids mirror the three filter chips, in chip order.
export const CATEGORIES = [0, 1, 2] as const;
export type CategoryId = (typeof CATEGORIES)[number];

export type Localized = { title: string; tag: string; client: string; description: string };

export type PublicReel = {
  slug: string;
  src: string;
  poster: string;
  category: CategoryId;
  featured: boolean;
  en: Localized;
  ar: Localized;
};

export type PublicWork = {
  id: string;
  title: string;
  en: { tag: string; period: string; body: string };
  ar: { tag: string; period: string; body: string };
};

export type PublicService = {
  id: string;
  en: { title: string; body: string };
  ar: { title: string; body: string };
};

export type SiteData = {
  reels: PublicReel[]; // canonical order: sort_order ascending (oldest → newest)
  work: PublicWork[];
  services: PublicService[];
  source: "db" | "fallback";
};

// ── posters ──────────────────────────────────────────────────
// The 17 original posters ship bundled with the app (hashed + optimised by
// Vite), so they stay the fastest option. A reel added from the dashboard
// has no bundled poster, so it falls back to a Cloudinary frame grab —
// which means pasting a video URL is enough, no upload required.
const BUNDLED_POSTER: Record<string, string> = Object.fromEntries(
  VIDEO_MEDIA.map((m) => [m.slug, m.poster]),
);

export function cloudinaryFrame(src: string): string {
  if (!src.includes("/upload/")) return "";
  return src
    .replace("/upload/", "/upload/so_2,w_800,c_limit,q_auto,f_auto/")
    .replace(/\.mp4$/i, ".webp");
}

export function resolvePoster(slug: string, posterUrl: string | null, src: string): string {
  return posterUrl || BUNDLED_POSTER[slug] || cloudinaryFrame(src);
}

// ── fallback (the hardcoded site) ────────────────────────────
// Group membership as it was hardcoded in VideoReels, kept here so the
// fallback path renders byte-identically to the pre-database site.
const FALLBACK_GROUPS: number[][] = [
  [0, 1, 2, 3, 4, 5, 13, 14, 15],
  [6, 7, 8],
  [9, 10, 11, 12, 16],
];
const FALLBACK_HERO = 0;

const CATEGORY_OF_FALLBACK_INDEX: Record<number, CategoryId> = {};
FALLBACK_GROUPS.forEach((g, gi) =>
  g.forEach((i) => (CATEGORY_OF_FALLBACK_INDEX[i] = gi as CategoryId)),
);

export function fallbackData(): SiteData {
  return {
    reels: VIDEO_MEDIA.map((m, i) => ({
      slug: m.slug,
      src: m.src,
      poster: m.poster,
      category: CATEGORY_OF_FALLBACK_INDEX[i] ?? 0,
      featured: i === FALLBACK_HERO,
      en: CONTENT.en.videos[i],
      ar: CONTENT.ar.videos[i],
    })),
    work: CONTENT.en.work.cards.map((card, i) => ({
      id: `fallback-work-${i}`,
      title: card.title,
      en: { tag: card.tag, period: card.period, body: card.body },
      ar: {
        tag: CONTENT.ar.work.cards[i].tag,
        period: CONTENT.ar.work.cards[i].period,
        body: CONTENT.ar.work.cards[i].body,
      },
    })),
    services: CONTENT.en.services.cards.map((card, i) => ({
      id: `fallback-service-${i}`,
      en: { title: card.title, body: card.body },
      ar: {
        title: CONTENT.ar.services.cards[i].title,
        body: CONTENT.ar.services.cards[i].body,
      },
    })),
    source: "fallback",
  };
}

// ── load ─────────────────────────────────────────────────────
type ReelRow = {
  slug: string;
  category: number;
  is_featured: boolean;
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
};

type WorkRow = {
  id: string;
  title: string;
  tag_en: string;
  tag_ar: string;
  period_en: string;
  period_ar: string;
  body_en: string;
  body_ar: string;
};

type ServiceRow = {
  id: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
};

/**
 * Reads the published site content. Never throws and never returns an empty
 * site: any failure degrades to the hardcoded content.
 */
export async function loadSiteData(): Promise<SiteData> {
  if (!isSupabaseConfigured) return fallbackData();

  const PUBLISHED = "is_published=eq.true&order=sort_order.asc";

  try {
    const [reelRows, workRows, serviceRows] = await Promise.all([
      restSelect<ReelRow>(
        "reels",
        "select=slug,category,is_featured,video_url,poster_url," +
          "title_en,title_ar,tag_en,tag_ar,client_en,client_ar," +
          `description_en,description_ar&${PUBLISHED}`,
      ),
      restSelect<WorkRow>(
        "work_cards",
        `select=id,title,tag_en,tag_ar,period_en,period_ar,body_en,body_ar&${PUBLISHED}`,
      ),
      restSelect<ServiceRow>(
        "services",
        `select=id,title_en,title_ar,body_en,body_ar&${PUBLISHED}`,
      ),
    ]);

    // No reels means the migration has not been run yet (or the request
    // failed). A half-populated site is worse than the known-good one.
    if (!reelRows?.length) return fallbackData();

    const fb = fallbackData();

    return {
      reels: reelRows.map((r) => ({
        slug: r.slug,
        src: r.video_url,
        poster: resolvePoster(r.slug, r.poster_url, r.video_url),
        category: (CATEGORIES.includes(r.category as CategoryId) ? r.category : 0) as CategoryId,
        featured: r.is_featured,
        en: {
          title: r.title_en,
          tag: r.tag_en,
          client: r.client_en,
          description: r.description_en,
        },
        // Arabic falls back to English per-field: a reel added in a hurry
        // shows English copy rather than a blank card.
        ar: {
          title: r.title_ar || r.title_en,
          tag: r.tag_ar || r.tag_en,
          client: r.client_ar || r.client_en,
          description: r.description_ar || r.description_en,
        },
      })),
      work: !workRows?.length
        ? fb.work
        : workRows.map((w) => ({
            id: w.id,
            title: w.title,
            en: { tag: w.tag_en, period: w.period_en, body: w.body_en },
            ar: {
              tag: w.tag_ar || w.tag_en,
              period: w.period_ar || w.period_en,
              body: w.body_ar || w.body_en,
            },
          })),
      services: !serviceRows?.length
        ? fb.services
        : serviceRows.map((s) => ({
            id: s.id,
            en: { title: s.title_en, body: s.body_en },
            ar: { title: s.title_ar || s.title_en, body: s.body_ar || s.body_en },
          })),
      source: "db",
    };
  } catch {
    return fallbackData();
  }
}

// ── derived views (what the components consume) ──────────────

export function mediaOf(data: SiteData): VideoMedia[] {
  return data.reels.map((r) => ({ slug: r.slug, src: r.src, poster: r.poster }));
}

/** Index arrays per category, in canonical order — the old VIDEO_GROUPS. */
export function groupsOf(data: SiteData): number[][] {
  const groups: number[][] = [[], [], []];
  data.reels.forEach((r, i) => groups[r.category]?.push(i));
  return groups;
}

/** The featured reel's index. Falls back to 0 so the stage is never empty. */
export function heroIndexOf(data: SiteData): number {
  const i = data.reels.findIndex((r) => r.featured);
  return i === -1 ? 0 : i;
}

/** CONTENT[lang], with the database-backed sections swapped in. */
export function contentFor(lang: Lang, data: SiteData): SiteContent {
  const base = CONTENT[lang];
  return {
    ...base,
    videos: data.reels.map((r) => r[lang]),
    services: { ...base.services, cards: data.services.map((s) => s[lang]) },
    work: {
      ...base.work,
      cards: data.work.map((w) => ({ ...w[lang], title: w.title })),
    },
  };
}
