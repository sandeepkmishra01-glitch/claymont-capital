import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDeals, useLookups, useStageHistory } from '../../lib/queries';
import { analyticsKpis, avgDaysByStage, funnel } from '../../lib/metrics';
import { money, pct } from '../../lib/format';
import { KpiCard } from '../shared/KpiCard';
import { LoadingBlock, Panel } from '../shared/Overlay';

const axisStyle = { fontSize: 12, fill: '#6b6a63' };

export function AnalyticsPage() {
  const deals = useDeals();
  const history = useStageHistory();
  const { stages } = useLookups();

  if (deals.isLoading || history.isLoading) return <LoadingBlock />;
  const all = deals.data ?? [];
  const hist = history.data ?? [];
  const k = analyticsKpis(all, hist);
  const velocity = funnel(all, hist, stages).map((f) => ({ name: f.stage.shortLabel, label: f.stage.label, count: f.count, color: f.stage.colorHex }));
  const timeInStage = avgDaysByStage(all, hist, stages)
    .filter((s) => s.days != null)
    .map((s) => ({ name: s.stage.label, days: Math.round(s.days! * 10) / 10, color: s.stage.colorHex }));

  const delta = k.recentVsPriorDays;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Win rate" value={pct(k.winRate, 0)} hint={`${k.won} won · ${k.lost} passed`} hintTone={k.won ? 'good' : 'muted'} />
        <KpiCard label="Avg deal size" value={money(k.avgDealSize)} hint="asking enterprise value" />
        <KpiCard label="Avg EBITDA margin" value={pct(k.avgMargin)} hint="across all deals" />
        <KpiCard
          label="Avg time in stage"
          value={k.avgDaysInStage != null ? `${Math.round(k.avgDaysInStage)}d` : '—'}
          hint={delta != null ? `${delta <= 0 ? '↓' : '↑'} ${Math.abs(Math.round(delta))}d last 90 days vs prior` : 'completed stage visits'}
          hintTone={delta == null ? 'muted' : delta <= 0 ? 'good' : 'bad'}
        />
      </div>

      <Panel title="Deal Velocity by Stage" subtitle="Deals that reached each stage (won deals count through close)">
        <div className="h-[340px] px-2 py-5 sm:px-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={velocity} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#ece8dd" />
              <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={{ stroke: '#e7e2d6' }} />
              <YAxis allowDecimals={false} tick={axisStyle} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(26,77,77,0.05)' }}
                formatter={(v) => [v, 'Deals at or past stage']}
                labelFormatter={(_, p) => p?.[0]?.payload?.label ?? ''}
                contentStyle={{ borderRadius: 10, border: '1px solid #e7e2d6', fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={72}>
                {velocity.map((v) => <Cell key={v.name} fill={v.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <Panel title="Average Days in Stage" subtitle="Completed stage visits — where deals slow down">
        {timeInStage.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted">Not enough stage history yet.</p>
        ) : (
          <div className="px-2 py-5 sm:px-4" style={{ height: 60 + timeInStage.length * 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeInStage} layout="vertical" margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="#ece8dd" />
                <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} unit="d" />
                <YAxis type="category" dataKey="name" width={120} tick={axisStyle} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(26,77,77,0.05)' }}
                  formatter={(v) => [`${v} days`, 'Average']}
                  contentStyle={{ borderRadius: 10, border: '1px solid #e7e2d6', fontSize: 13 }}
                />
                <Bar dataKey="days" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {timeInStage.map((v) => <Cell key={v.name} fill={v.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>
    </div>
  );
}
