import { useMemo, useState, type ReactNode } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import clsx from 'clsx';
import { useDeals, useLookups, useMembers, useUpdateDeal } from '../../lib/queries';
import type { Deal, Member, Priority, Stage } from '../../lib/types';
import { money } from '../../lib/format';
import { useUi } from '../../context/UiContext';
import { useToast } from '../../context/ToastContext';
import { DealCard } from './DealCard';
import { LoadingBlock } from '../shared/Overlay';

const PRIORITIES: Priority[] = ['high', 'medium', 'low'];

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'border-teal-700 bg-teal-700 text-white' : 'border-line bg-white text-ink hover:border-teal-500',
      )}
    >
      {children}
    </button>
  );
}

function DraggableCard({ deal, industry, members, onOpen }: { deal: Deal; industry: string; members: Map<string, Member>; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
        else listeners?.onKeyDown?.(e);
      }}
      aria-label={`${deal.companyName}. Press space to pick up and move between stages, Enter to open.`}
      className={clsx('touch-none rounded-xl', isDragging && 'opacity-30')}
    >
      <DealCard deal={deal} industry={industry} members={members} />
    </div>
  );
}

function Column({ stage, deals, children }: { stage: Stage; deals: Deal[]; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const ev = deals.reduce((s, d) => s + (d.askingPrice ?? 0), 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage.label} column`}
      className={clsx(
        'flex w-[300px] shrink-0 flex-col rounded-2xl border bg-stone-100/70 transition-colors',
        isOver ? 'border-teal-500 bg-teal-50' : 'border-line',
      )}
    >
      <header className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.colorHex }} />
        <h2 className="flex-1 font-sans text-sm font-bold tracking-[0.06em] text-ink uppercase">{stage.label}</h2>
        <span className="rounded-full border border-line bg-white px-2 text-xs font-semibold text-ink">{deals.length}</span>
      </header>
      {deals.length > 0 && <p className="px-4 pt-2 text-xs text-muted">{money(ev)} asking EV</p>}
      <div className="flex min-h-[140px] flex-1 flex-col gap-3 p-3">{children}</div>
    </section>
  );
}

export function PipelinePage() {
  const deals = useDeals();
  const members = useMembers();
  const { stages, industries, industryLabel, stageByKey } = useLookups();
  const update = useUpdateDeal();
  const { openDeal } = useUi();
  const toast = useToast();
  const [industry, setIndustry] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Set<Priority>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const active = useMemo(() => (deals.data ?? []).filter((d) => d.status === 'active'), [deals.data]);
  const visible = active.filter(
    (d) => (!industry || d.industryKey === industry) && (priorities.size === 0 || priorities.has(d.priority)),
  );
  const usedIndustries = industries.filter((i) => active.some((d) => d.industryKey === i.key));
  const dragging = draggingId ? active.find((d) => d.id === draggingId) : undefined;

  const onDragStart = (e: DragStartEvent) => setDraggingId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const deal = active.find((d) => d.id === e.active.id);
    const target = e.over?.id ? String(e.over.id) : null;
    if (!deal || !target || target === deal.stageKey) return;
    update.mutate(
      { id: deal.id, stageKey: target },
      {
        onSuccess: () => toast(`${deal.companyName} moved to ${stageByKey.get(target)?.label}`),
        onError: (err) => toast(err.message, 'error'),
      },
    );
  };

  const togglePriority = (p: Priority) =>
    setPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  if (deals.isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Industry</span>
          <Pill active={!industry} onClick={() => setIndustry(null)}>All</Pill>
          {usedIndustries.map((i) => (
            <Pill key={i.key} active={industry === i.key} onClick={() => setIndustry(industry === i.key ? null : i.key)}>
              {i.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">Priority</span>
          {PRIORITIES.map((p) => (
            <Pill key={p} active={priorities.has(p)} onClick={() => togglePriority(p)}>{p}</Pill>
          ))}
          {(industry || priorities.size > 0) && (
            <button onClick={() => { setIndustry(null); setPriorities(new Set()); }} className="ml-2 text-sm font-medium text-teal-700 hover:underline">
              Clear filters
            </button>
          )}
          <span className="ml-auto text-sm text-muted">{visible.length} of {active.length} active deals</span>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDraggingId(null)}>
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-8 sm:px-8">
          <div className="flex gap-4">
            {stages.map((stage) => {
              const colDeals = visible.filter((d) => d.stageKey === stage.key);
              return (
                <Column key={stage.key} stage={stage} deals={colDeals}>
                  {colDeals.map((d) => (
                    <DraggableCard
                      key={d.id}
                      deal={d}
                      industry={industryLabel(d.industryKey)}
                      members={members.byId}
                      onOpen={() => openDeal(d.id)}
                    />
                  ))}
                </Column>
              );
            })}
          </div>
        </div>
        <DragOverlay>
          {dragging && <DealCard deal={dragging} industry={industryLabel(dragging.industryKey)} members={members.byId} dragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
