import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, FileText } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { reports } from "@/lib/ev-data";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Resources — Power Grid" },
      { name: "description", content: "Curated government, industry and research reports on EVs and charging infrastructure in India." },
      { property: "og:title", content: "Reports & Resources — Power Grid" },
      { property: "og:description", content: "Curated reports on EVs and charging infrastructure in India." },
    ],
  }),
  component: Reports,
});

function Reports() {
  return (
    <>
      <PageHeader eyebrow="Library" title="Reports & resources" desc="Policy documents, datasets and research on India's EV charging ecosystem." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="glass group flex flex-col rounded-xl p-5 transition hover:-translate-y-1 hover:border-primary">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs text-primary">{r.tag}</span>
              <span className="text-xs text-muted-foreground">{r.year}</span>
            </div>
            <FileText className="mt-4 h-6 w-6 text-accent" />
            <h3 className="mt-3 font-semibold leading-snug">{r.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.org}</p>
            <span className="mt-auto flex items-center gap-1 pt-4 text-sm text-primary">
              Open report <ExternalLink className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </a>
        ))}
      </div>
    </>
  );
}
