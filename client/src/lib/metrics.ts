import { differenceInHours, subDays } from 'date-fns';
import type { Deal, Stage, StageChange } from './types';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : null);
const defined = <T,>(x: T | null | undefined): x is T => x != null;

export const activeOf = (deals: Deal[]) => deals.filter((d) => d.status === 'active');

export function portfolioKpis(deals: Deal[]) {
  const active = activeOf(deals);
  const monthAgo = subDays(new Date(), 30);
  return {
    activeCount: active.length,
    newThisMonth: active.filter((d) => new Date(d.createdAt) >= monthAgo).length,
    pipelineValue: sum(active.map((d) => d.askingPrice).filter(defined)),
    aggregateEbitda: sum(active.map((d) => d.ebitda).filter(defined)),
    avgMultiple: avg(active.map((d) => d.askingMultiple).filter(defined)),
    avgMargin: avg(active.map((d) => d.ebitdaMargin).filter(defined)),
  };
}

export function stageCounts(deals: Deal[], stages: Stage[]) {
  const active = activeOf(deals);
  return stages.map((s) => ({ stage: s, count: active.filter((d) => d.stageKey === s.key).length }));
}

/** Furthest stage index each deal has ever reached, from history with its current stage as fallback. */
export function furthestStageIndex(deals: Deal[], history: StageChange[], stages: Stage[]) {
  const order = new Map(stages.map((s, i) => [s.key, i]));
  const furthest = new Map<string, number>();
  for (const d of deals) furthest.set(d.id, order.get(d.stageKey ?? '') ?? 0);
  for (const h of history) {
    const i = order.get(h.toStageKey);
    if (i !== undefined && furthest.has(h.dealId)) furthest.set(h.dealId, Math.max(furthest.get(h.dealId)!, i));
  }
  return furthest;
}

export function funnel(deals: Deal[], history: StageChange[], stages: Stage[]) {
  const furthest = furthestStageIndex(deals, history, stages);
  return stages.map((stage, i) => ({
    stage,
    count: deals.filter((d) => {
      const f = furthest.get(d.id) ?? 0;
      return d.status === 'won' ? true : f >= i;
    }).length,
  }));
}

/** Hours spent in each stage visit that has ended (moved on or deal closed). */
export function stageDurations(deals: Deal[], history: StageChange[]) {
  const byDeal = new Map<string, StageChange[]>();
  for (const h of history) byDeal.set(h.dealId, [...(byDeal.get(h.dealId) ?? []), h]);
  const dealById = new Map(deals.map((d) => [d.id, d]));
  const out: { stageKey: string; days: number; closedAt: Date }[] = [];
  for (const [dealId, rows] of byDeal) {
    const deal = dealById.get(dealId);
    if (!deal) continue;
    const sorted = [...rows].sort((a, b) => a.changedAt.localeCompare(b.changedAt));
    sorted.forEach((row, i) => {
      const next = sorted[i + 1]?.changedAt ?? (deal.status !== 'active' ? deal.closedAt : null);
      if (!next) return;
      out.push({
        stageKey: row.toStageKey,
        days: differenceInHours(new Date(next), new Date(row.changedAt)) / 24,
        closedAt: new Date(next),
      });
    });
  }
  return out;
}

export function analyticsKpis(deals: Deal[], history: StageChange[]) {
  const won = deals.filter((d) => d.status === 'won').length;
  const lost = deals.filter((d) => d.status === 'lost').length;
  const durations = stageDurations(deals, history);
  const cutoff = subDays(new Date(), 90);
  const recent = avg(durations.filter((d) => d.closedAt >= cutoff).map((d) => d.days));
  const prior = avg(durations.filter((d) => d.closedAt < cutoff).map((d) => d.days));
  return {
    winRate: won + lost ? (won / (won + lost)) * 100 : null,
    won,
    lost,
    avgDealSize: avg(deals.map((d) => d.askingPrice).filter(defined)),
    avgMargin: avg(deals.map((d) => d.ebitdaMargin).filter(defined)),
    avgDaysInStage: avg(durations.map((d) => d.days)),
    recentVsPriorDays: recent != null && prior != null ? recent - prior : null,
  };
}

export function avgDaysByStage(deals: Deal[], history: StageChange[], stages: Stage[]) {
  const durations = stageDurations(deals, history);
  return stages.map((stage) => ({ stage, days: avg(durations.filter((d) => d.stageKey === stage.key).map((d) => d.days)) }));
}

export function sourcePerformance(deals: Deal[], history: StageChange[], stages: Stage[], sourceKeys: string[]) {
  const furthest = furthestStageIndex(deals, history, stages);
  const ndaIndex = stages.findIndex((s) => s.key === 'nda_signed');
  const loiIndex = stages.findIndex((s) => s.key === 'loi_submitted');
  const rows = sourceKeys.map((key) => {
    const mine = deals.filter((d) => d.sourceKey === key);
    const advanced = mine.filter((d) => (furthest.get(d.id) ?? 0) >= ndaIndex).length;
    return {
      key,
      deals: mine.length,
      advanced,
      advancedPct: mine.length ? (advanced / mine.length) * 100 : 0,
      pipelineValue: sum(activeOf(mine).map((d) => d.askingPrice).filter(defined)),
      reachedLoi: mine.filter((d) => (furthest.get(d.id) ?? 0) >= loiIndex).length,
    };
  });
  const total = deals.length;
  const reachedLoi = sum(rows.map((r) => r.reachedLoi));
  return {
    rows: rows.sort((a, b) => b.deals - a.deals || b.pipelineValue - a.pipelineValue),
    activeSources: rows.filter((r) => r.deals > 0).length,
    conversionToLoi: total ? (reachedLoi / total) * 100 : null,
  };
}

export function industryRollup(deals: Deal[], industryKeys: string[]) {
  return industryKeys.map((key) => {
    const mine = deals.filter((d) => (d.industryKey ?? 'other') === key);
    const active = activeOf(mine);
    return {
      key,
      total: mine.length,
      active: active.length,
      revenue: sum(active.map((d) => d.revenue).filter(defined)),
      ebitda: sum(active.map((d) => d.ebitda).filter(defined)),
      pipelineValue: sum(active.map((d) => d.askingPrice).filter(defined)),
    };
  });
}
