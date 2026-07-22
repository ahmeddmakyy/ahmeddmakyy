// ─────────────────────────────────────────────────────────────
// Cloudinary-hosted reels + a stable, language-independent `slug`
// (used for ?v=<slug> deep links) + a bundled webp poster for an
// instant first paint of each card. Shared by the Videos section
// (VideoReels) and the VideoObject JSON-LD in the root route, so
// the two can never drift apart. Order MUST match
// CONTENT[lang].videos and VIDEO_GROUPS in VideoReels.
// ─────────────────────────────────────────────────────────────
import renewStoryPoster from "@/assets/posters/renew_story.webp";
import renewStarPoster from "@/assets/posters/renew_star.webp";
import easyWayPoster from "@/assets/posters/easy_way.webp";
import golfCityPoster from "@/assets/posters/golf_city.webp";
import alwassefPoster from "@/assets/posters/alwassef.webp";
import alwassefGeelyPoster from "@/assets/posters/alwassef_geely.webp";
import drKashefPoster from "@/assets/posters/dr_kashef.webp";
import textMotionPoster from "@/assets/posters/text_motion.webp";
import letsGoBigPoster from "@/assets/posters/lets_go_big.webp";
import hyperframePoster from "@/assets/posters/hyperframe.webp";
import abbasAppPoster from "@/assets/posters/abbas_app.webp";
import abbasChatPoster from "@/assets/posters/abbas_chatgpt.webp";
import quickLoanPoster from "@/assets/posters/quick_loan.webp";
import demoStarPoster from "@/assets/posters/demo_star.webp";
import trustMotorsPoster from "@/assets/posters/trust_motors.webp";
import summerCoastPoster from "@/assets/posters/summer_coast.webp";

const CLOUD = "https://res.cloudinary.com/ahmedmakyy/video/upload";

export type VideoMedia = { slug: string; src: string; poster: string };

export const VIDEO_MEDIA: VideoMedia[] = [
  {
    slug: "renew-story",
    src: `${CLOUD}/v1784334179/compressO-renew_media_motion_graphic_ybku0x.mp4`,
    poster: renewStoryPoster,
  },
  {
    slug: "renew-star",
    src: `${CLOUD}/v1784334122/compressO-RENEW_MEDIA_MOTION_KSA_kjlqd8.mp4`,
    poster: renewStarPoster,
  },
  { slug: "easy-way", src: `${CLOUD}/v1784335254/easy_way_iwy4h2.mp4`, poster: easyWayPoster },
  {
    slug: "golf-city",
    src: `${CLOUD}/v1784334512/compressO-%D8%AC%D9%88%D9%84%D9%81_%D8%B3%D9%8A%D8%AA%D9%8A_zzudoe.mp4`,
    poster: golfCityPoster,
  },
  {
    slug: "alwassef",
    src: `${CLOUD}/v1784334088/elwaseef_final_hfkw8g.mp4`,
    poster: alwassefPoster,
  },
  { slug: "dr-elkashef", src: `${CLOUD}/v1784335848/0625_1_1_l1vbcl.mp4`, poster: drKashefPoster },
  {
    slug: "story-problem",
    src: `${CLOUD}/v1784334599/text-motion_muphmj.mp4`,
    poster: textMotionPoster,
  },
  {
    slug: "lets-go-big",
    src: `${CLOUD}/v1784334583/lets-go-big_jhm6wz.mp4`,
    poster: letsGoBigPoster,
  },
  {
    slug: "portfolio-in-motion",
    src: `${CLOUD}/v1784336497/portfolio-hyperframe_ptwnet.mp4`,
    poster: hyperframePoster,
  },
  {
    slug: "abbas-app",
    src: `${CLOUD}/v1784334048/compressO-%D9%85%D8%AD%D9%85%D8%AF_%D8%B9%D8%A8%D8%A7%D8%B3_ui_animation_vid_fbcazt.mp4`,
    poster: abbasAppPoster,
  },
  {
    slug: "abbas-chat",
    src: `${CLOUD}/v1784334561/abbas-motors-chatgpt-ad_kbei7j.mp4`,
    poster: abbasChatPoster,
  },
  {
    slug: "quick-loan",
    src: `${CLOUD}/v1784334687/quick-loan-ui-animation_ebdlro.mp4`,
    poster: quickLoanPoster,
  },
  {
    slug: "demo-star",
    src: `${CLOUD}/v1784334649/demo-star-ui-animation_k10svm.mp4`,
    poster: demoStarPoster,
  },
  {
    slug: "alwassef-geely",
    src: `${CLOUD}/v1784573775/ELWASEEF_GEELY_biqo85.mp4`,
    poster: alwassefGeelyPoster,
  },
  {
    slug: "trust-motors",
    src: `${CLOUD}/v1784673874/chance_v2_oxaram.mp4`,
    poster: trustMotorsPoster,
  },
  {
    slug: "trust-summer",
    src: `${CLOUD}/v1784738431/compressO-START_YOUR_SUMMER_sohhcs.mp4`,
    poster: summerCoastPoster,
  },
];

// A Cloudinary frame-grab (2s in) of a reel's mp4, as a stable absolute JPG URL
// — used for VideoObject.thumbnailUrl in the JSON-LD. Turns
//   …/upload/v123/clip.mp4  →  …/upload/so_2/v123/clip.jpg
export function posterUrlFromSrc(src: string): string {
  return src.replace("/upload/", "/upload/so_2/").replace(/\.mp4$/, ".jpg");
}

// Cloudinary version numbers (the v<digits> in the URL) are the asset version's
// Unix timestamp, so the upload date is derivable with no extra data to keep in
// sync — used for VideoObject.uploadDate (YYYY-MM-DD, UTC).
export function uploadDateFromSrc(src: string): string {
  const m = src.match(/\/v(\d{9,})\//);
  if (!m) return "";
  return new Date(Number(m[1]) * 1000).toISOString().slice(0, 10);
}
