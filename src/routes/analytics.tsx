import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Area } from "recharts";
import { PageHeader, Panel, CHART_COLORS, tooltipStyle } from "@/components/AppShell";
import { salesFY, vehicleShare, registrationGrowth, industryGrowth, stateGrowth } from "@/lib/ev-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "EV Analytics — Power Grid" },
      { name: "description", content: "EV sales projections to 2030, vehicle share, registrations, industry and state-wise growth in India." },
      { property: "og:title", content: "EV Analytics — Power Grid" },
      { property: "og:description", content: "EV sales projections to 2030 and state-wise EV growth in India." },
    ],
  }),
  component: Analytics,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };

function Analytics() {
  return (
    <>
      <PageHeader eyebrow="Market intelligence" title="EV analytics" desc="How India's electric mobility market is growing — and where it's heading by 2030. Figures in millions unless noted." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="EV sales: actual vs projected by FY (million units)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={salesFY}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="fy" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="actual" name="Actual" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Line dataKey="projected" name="Projected" stroke="var(--chart-2)" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="EV share on Indian roads by vehicle type (%)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={vehicleShare} dataKey="value" nameKey="name" innerRadius={55} outerRadius={100} paddingAngle={3} stroke="none" label={({ value }) => `${value}%`}>
                {vehicleShare.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Monthly EV registrations ('000), FY25 vs FY26">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={registrationGrowth}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="y24" name="FY25" stroke="var(--chart-5)" strokeWidth={2} />
              <Line dataKey="y25" name="FY26" stroke="var(--chart-1)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="EV industry growth (USD billion)">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={industryGrowth}>
              <defs>
                <linearGradient id="mkt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area dataKey="market" name="Market size" stroke="var(--chart-2)" fill="url(#mkt)" strokeWidth={2} />
              <Bar dataKey="investment" name="Investment" fill="var(--chart-3)" radius={[6, 6, 0, 0]} barSize={22} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="State-wise EV growth (YoY %) and penetration (%)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stateGrowth}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="state" {...axis} />
              <YAxis {...axis} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="growth" name="YoY growth" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="penetration" name="Penetration" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Figures are indicative, compiled from public sources such as Vahan, SMEV and NITI Aayog.</p>
    </>
  );
}
