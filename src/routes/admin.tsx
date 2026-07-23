import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import "@/styles/admin.css";
import { useAdminSession } from "@/lib/admin/session";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard — Ahmed Maki" },
      // The dashboard must never surface in search results, and following
      // links out of it should not pass any signal either.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

// `exact` on the index tab only — otherwise every /admin/* path would also
// light up "Overview", since they all start with /admin.
const TABS: { to: string; label: string; exact: boolean }[] = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/reels", label: "Reels", exact: false },
  { to: "/admin/work", label: "Selected Work", exact: false },
  { to: "/admin/services", label: "Services", exact: false },
];

function AdminLayout() {
  const { status, email, signIn, signOut } = useAdminSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (status === "loading") {
    return (
      <div className="adm-login">
        <p className="adm-login-lede">Checking your session…</p>
      </div>
    );
  }

  if (status === "unconfigured") return <Unconfigured />;
  if (status === "anon") return <LoginScreen onSubmit={signIn} />;
  if (status === "not-admin") return <NotAdmin email={email} onSignOut={signOut} />;

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-brand">
          Maki <span>Dashboard</span>
        </div>
        <span className="adm-who">{email}</span>
        <a className="adm-btn" href="/" target="_blank" rel="noreferrer">
          View site ↗
        </a>
        <button type="button" className="adm-btn" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      <nav className="adm-nav" aria-label="Dashboard sections">
        {TABS.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link key={t.to} to={t.to} className={`adm-tab${active ? " is-active" : ""}`}>
              {t.label}
            </Link>
          );
        })}
      </nav>

      <Outlet />
    </div>
  );
}

function LoginScreen({
  onSubmit,
}: {
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form className="adm-login-box" onSubmit={submit}>
        <h1 className="adm-login-title">Sign in</h1>
        <p className="adm-login-lede">Portfolio dashboard.</p>

        {error && <p className="adm-error">{error}</p>}

        <div className="adm-field">
          <label className="adm-label" htmlFor="adm-email">
            Email
          </label>
          <input
            id="adm-email"
            className="adm-input"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="adm-field">
          <label className="adm-label" htmlFor="adm-pass">
            Password
          </label>
          <input
            id="adm-pass"
            className="adm-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

function NotAdmin({ email, onSignOut }: { email: string | null; onSignOut: () => Promise<void> }) {
  return (
    <div className="adm-login">
      <div className="adm-login-box">
        <h1 className="adm-login-title">Not an admin</h1>
        <p className="adm-login-lede">
          {email} is signed in but has no admin access, so nothing here is editable.
        </p>
        <p className="adm-note">
          Add this account to the <code>public.admins</code> table — see{" "}
          <code>supabase/migrations/0003_grant_admin.sql</code>.
        </p>
        <button type="button" className="adm-btn" onClick={() => void onSignOut()}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function Unconfigured() {
  return (
    <div className="adm-login">
      <div className="adm-login-box">
        <h1 className="adm-login-title">Not connected</h1>
        <p className="adm-login-lede">
          The dashboard needs the Supabase keys before it can do anything.
        </p>
        <p className="adm-note">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in{" "}
          <code>.env.local</code> (see <code>.env.example</code>), then restart the dev server.
        </p>
      </div>
    </div>
  );
}
