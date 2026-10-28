import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Zap, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Power Grid" },
      { name: "description", content: "Sign in to Power Grid, India's EV charging intelligence platform." },
      { property: "og:title", content: "Sign in — Power Grid" },
      { property: "og:description", content: "Sign in to Power Grid." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else navigate({ to: "/" });
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      if (error) toast.error(error.message);
      else if (!data.session) toast.success("Check your email to confirm your account.");
      else navigate({ to: "/" });
    }
    setBusy(false);
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
    else if (!r.redirected) navigate({ to: "/" });
  }

  return (
    <div className="grid-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="glass relative w-full max-w-md rounded-2xl p-8 shadow-glow animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Zap className="h-7 w-7 text-primary-foreground" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Power<span className="text-primary">Grid</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Sign in to India's EV charging intelligence" : "Create your Power Grid account"}</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Email</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border bg-input px-3 focus-within:border-primary">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="you@company.in" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Password</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg border bg-input px-3 focus-within:border-primary">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent py-2.5 text-sm outline-none" placeholder="••••••••" />
            </div>
          </label>
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
        <button onClick={google} className="w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-secondary">Continue with Google</button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "in" ? "New to Power Grid?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="font-medium text-primary hover:underline">
            {mode === "in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
