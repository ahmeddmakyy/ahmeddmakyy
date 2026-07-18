import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    if (import.meta.env.DEV) console.error(error);
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const SITE_TITLE = "Ahmed Maki — AI Content Creator & Video Editor | Reels With Maki";
const SITE_DESC =
  "Ahmed Maki (Reels With Maki) directs Veo, FLUX & Gemini and edits the footage into finished films — content strategy, brand campaigns & AI video for 15+ brands across Egypt & KSA.";
const OG_IMAGE =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/kBYrN7AScPVPxk5LcflXYJzXNIJ2/social-images/social-1783643425130-ChatGPT_Image_Jul_10,_2026,_03_30_14_AM.webp";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#050505" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESC },
      { name: "author", content: "Ahmed Maki" },
      { property: "og:site_name", content: "Reels With Maki" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESC },
      { property: "og:type", content: "profile" },
      { property: "profile:first_name", content: "Ahmed" },
      { property: "profile:last_name", content: "Maki" },
      { property: "og:locale", content: "en_US" },
      { property: "og:locale:alternate", content: "ar_EG" },
      { property: "og:url", content: "https://ahmeddmakyy.lovable.app/" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:alt", content: "Ahmed Maki — AI content creator & video editor" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESC },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: "Ahmed Maki — AI content creator & video editor" },
    ],
    links: [
      { rel: "canonical", href: "https://ahmeddmakyy.lovable.app/" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: "Ahmed Maki",
            alternateName: "Reels With Maki",
            jobTitle: "AI Content Creator & Video Editor",
            url: "https://ahmeddmakyy.lovable.app/",
            email: "ahmeddmakyy@gmail.com",
            image: OG_IMAGE,
            sameAs: [
              "https://www.instagram.com/reelswithmaki/",
              "https://www.linkedin.com/in/ahmeddmakyy11",
            ],
            address: {
              "@type": "PostalAddress",
              addressLocality: "Cairo",
              addressRegion: "Cairo",
              addressCountry: "EG",
            },
            worksFor: { "@type": "Organization", name: "Renew Media" },
            alumniOf: { "@type": "CollegeOrUniversity", name: "Ain Shams University" },
            knowsLanguage: ["ar", "en"],
            hasOccupation: {
              "@type": "Occupation",
              name: "AI Content Creator & Video Editor",
            },
            knowsAbout: [
              "AI video production",
              "Video editing",
              "Brand strategy",
              "Copywriting",
              "Content strategy",
            ],
            makesOffer: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Brand Strategy & Content Planning" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Video Production" } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Copywriting & Brand Voice" } },
            ],
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Outlet />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
