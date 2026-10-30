import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, User, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/AppShell";
import { askAssistant } from "@/lib/assistant.functions";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — Power Grid" },
      { name: "description", content: "Ask anything about EV charging, policies and EV trends in India." },
      { property: "og:title", content: "AI Assistant — Power Grid" },
      { property: "og:description", content: "Ask anything about EV charging in India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Assistant,
});

type M = { role: "user" | "assistant"; content: string };
const SUGGEST = ["Fast chargers near Bengaluru airport?", "Cost to charge a Nexon EV at a DC station", "Which states have the best EV subsidies?", "Where should new stations be built in Pune?"];

function Assistant() {
  const ask = useServerFn(askAssistant);
  const [msgs, setMsgs] = useState<M[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [failed, setFailed] = useState<M[] | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function send(text: string, retry?: M[]) {
    const t = text.trim();
    if (!t || loading) return;
    if (t.length > 4000) { setErr("Please keep your question under 4,000 characters."); return; }
    const next = retry ?? [...msgs, { role: "user" as const, content: t }];
    setMsgs(next); setInput(""); setLoading(true); setErr(null);
    setFailed(null);
    try {
      const r = await ask({ data: { messages: next.slice(-20) } });
      if (r.error) { setErr(r.error); setFailed(next); }
      else setMsgs([...next, { role: "assistant", content: r.reply }]);
    } catch {
      setErr("Your question could not be sent. Check your connection and try again.");
      setFailed(next);
    } finally { setLoading(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Powered by AI" title="Power Grid assistant" desc="Ask about stations, charging costs, policies or EV market trends." />
      <div className="glass flex h-[65vh] flex-col rounded-xl">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Sparkles className="h-10 w-10 text-primary" />
              <p className="mt-3 text-muted-foreground">Try one of these:</p>
              <div className="mt-4 flex max-w-2xl flex-wrap justify-center gap-2">
                {SUGGEST.map((s) => (
                  <Button key={s} variant="outline" onClick={() => send(s)} className="h-auto whitespace-normal text-left">{s}</Button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && <Bot className="mt-1 h-6 w-6 shrink-0 text-primary" />}
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.content}</div>
              {m.role === "user" && <User className="mt-1 h-6 w-6 shrink-0 text-muted-foreground" />}
            </div>
          ))}
          {loading && <div className="flex gap-3"><Bot className="h-6 w-6 animate-pulse text-primary" /><span className="text-sm text-muted-foreground">Thinking…</span></div>}
          {err && <div role="alert" className="space-y-2"><p className="text-sm text-destructive">{err}</p>{failed && <Button variant="outline" size="sm" disabled={loading} onClick={() => send(failed.at(-1)?.content ?? "", failed)}><RotateCcw /> Retry question</Button>}</div>}
          <div ref={end} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t p-3">
          <input value={input} maxLength={4000} onChange={(e) => setInput(e.target.value)} placeholder="Ask about EV charging…" aria-label="Your question" className="min-w-0 flex-1 rounded-lg border bg-input px-4 py-2.5 text-sm outline-none focus:border-primary" />
          <Button type="submit" disabled={loading || !input.trim()} size="icon" className="h-11 shrink-0" aria-label="Send"><Send /></Button>
        </form>
      </div>
    </>
  );
}
