import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Zap, LayoutDashboard, BarChart3, Map, Bot, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/map", label: "Live Map", icon: Map },
  { to: "/assistant", label: "AI Assistant", icon: Bot },
  { to: "/reports", label: "Reports", icon: FileText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const isLogin = path === "/login";

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
      if (!session && !isLogin) navigate({ to: "/login" });
    });
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      if (!data.user && !isLogin) navigate({ to: "/login" });
      if (data.user && isLogin) navigate({ to: "/" });
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [isLogin, navigate]);

  if (isLogin) return <>{children}</>;
  if (!ready || !email)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );

  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold">Power<span className="text-primary">Grid</span></span>
          </Link>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground lg:inline">{email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">{title}</h1>
      {desc && <p className="mt-2 max-w-2xl text-muted-foreground">{desc}</p>}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-xl p-5 ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
export const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)" },
  labelStyle: { color: "var(--muted-foreground)" },
};
