import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import clsx from 'clsx';
import { useDeals, useLookups, useMembers } from '../../lib/queries';
import { useUi } from '../../context/UiContext';
import { Avatar } from '../shared/Avatar';
import { StageDot } from '../shared/Badges';

type Result =
  | { kind: 'deal'; id: string; title: string; detail: string; color: string }
  | { kind: 'member'; id: string; title: string; detail: string };

export function SearchBox() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const deals = useDeals();
  const members = useMembers();
  const { stageByKey, industryLabel } = useLookups();
  const { openDeal } = useUi();
  const navigate = useNavigate();

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const dealHits: Result[] = (deals.data ?? [])
      .filter((d) =>
        [d.companyName, d.legalName, d.location, industryLabel(d.industryKey)].some((f) => f?.toLowerCase().includes(q)),
      )
      .slice(0, 6)
      .map((d) => ({
        kind: 'deal',
        id: d.id,
        title: d.companyName,
        detail: d.status === 'active' ? stageByKey.get(d.stageKey ?? '')?.label ?? '' : d.status === 'won' ? 'Closed — won' : 'Passed',
        color: stageByKey.get(d.stageKey ?? '')?.colorHex ?? '#999',
      }));
    const memberHits: Result[] = (members.data ?? [])
      .filter((m) => [m.displayName, m.email, m.role].some((f) => f?.toLowerCase().includes(q)))
      .slice(0, 4)
      .map((m) => ({ kind: 'member', id: m.id, title: m.displayName, detail: m.role ?? 'Team member' }));
    return [...dealHits, ...memberHits];
  }, [query, deals.data, members.data, stageByKey, industryLabel]);

  const choose = (r: Result) => {
    if (r.kind === 'deal') openDeal(r.id);
    else navigate('/team');
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-md">
      <Search size={18} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => (a + 1) % results.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => (a - 1 + results.length) % results.length);
          } else if (e.key === 'Enter') {
            choose(results[active]!);
          }
        }}
        placeholder="Search deals, companies, people…"
        aria-label="Search deals, companies, and people"
        className="input h-11 rounded-xl border-transparent bg-stone-100/80 pl-10 focus:bg-white"
      />
      {open && query.trim() && (
        <div className="card absolute top-full right-0 left-0 z-30 mt-2 overflow-hidden py-1 shadow-xl">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No matches for “{query.trim()}”</p>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.kind}-${r.id}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(r)}
                onMouseEnter={() => setActive(i)}
                className={clsx('flex w-full items-center gap-3 px-4 py-2.5 text-left', i === active && 'bg-teal-50')}
              >
                {r.kind === 'deal' ? (
                  <StageDot color={r.color} />
                ) : (
                  <Avatar member={members.byId.get(r.id)} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{r.title}</span>
                  <span className="block truncate text-xs text-muted">{r.detail}</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wide text-faint uppercase">{r.kind}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
