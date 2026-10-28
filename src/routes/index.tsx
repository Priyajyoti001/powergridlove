import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Legend } from "recharts";
import { Zap, PlugZap, HardHat, Lightbulb, ArrowRight } from "lucide-react";
import { PageHeader, Panel, CHART_COLORS, tooltipStyle } from "@/components/AppShell";
import { NATIONAL, crowdByHour, topStates, statusShare, chargerTypes } from "@/lib/ev-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Power Grid" },
      { name: "description", content: "Live overview of EV charging stations across India: totals, availability and construction." },
      { property: "og:title", content: "Dashboard — Power Grid" },
      { property: "og:description", content: "Live overview of EV charging stations across India." },
    ],
  }),
  component: Dashboard,
});

const KPIS = [
  { label: "Total charging stations", value: NATIONAL.total, icon: Zap, tone: "text-primary", note: "+18% YoY" },
  { label: "Currently available", value: NATIONAL.available, icon: PlugZap, tone: "text-success", note: "74.6% uptime" },
  { label: "Under construction", value: NATIONAL.construction, icon: HardHat, tone: "text-warning", note: "Est. Q2 FY27" },
  { label: "Potential new sites", value: NATIONAL.potential, icon: Lightbulb, tone: "text-accent", note: "High-demand gaps" },
];

function Dashboard() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader eyebrow="National overview" title="EV charging across India" desc="A real-time snapshot of public charging infrastructure, demand and growth." />
        <Link to="/map" className="mb-8 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-90">
          Open live map <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPIS.map((k) => (
          <Panel key={k.label}>
            <div className="flex items-start justify-between">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <k.icon className={`h-5 w-5 ${k.tone}`} />
            </div>
            <p className="mt-3 font-display text-3xl font-bold">{k.value.toLocaleString("en-IN")}</p>
            <p className={`mt-1 text-xs ${k.tone}`}>{k.note}</p>
          </Panel>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Crowd intensity vs. hour of day (%)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={crowdByHour}>
              <defs>
                <linearGradient id="crowd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="crowd" stroke="var(--chart-1)" strokeWidth={2} fill="url(#crowd)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Station status share">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusShare} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} stroke="none">
                {statusShare.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top states by charging stations" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topStates} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis type="category" dataKey="state" stroke="var(--muted-foreground)" fontSize={12} width={90} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="stations" radius={[0, 6, 6, 0]}>
                {topStates.map((_, i) => <Cell key={i} fill={i < 3 ? "var(--chart-1)" : "var(--chart-2)"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Charger type mix">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={chargerTypes} dataKey="value" nameKey="name" outerRadius={95} stroke="none">
                {chargerTypes.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 1) % 5]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  );
}
