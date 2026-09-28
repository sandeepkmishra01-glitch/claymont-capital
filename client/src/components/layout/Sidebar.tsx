import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { NAV } from './nav';
import { LogoMark } from './Logo';
import { Avatar } from '../shared/Avatar';
import { useMe } from '../../context/SessionContext';
import { useUi } from '../../context/UiContext';

export function Sidebar() {
  const me = useMe();
  const { setSettingsOpen } = useUi();
  return (
    <nav className="sticky top-0 hidden h-screen w-[84px] shrink-0 flex-col items-center bg-gradient-to-b from-teal-800 to-teal-900 py-5 md:flex" aria-label="Main">
      <div className="mb-6 border-b border-white/10 pb-5" title="Claymont Capital Partners">
        <LogoMark size={44} />
      </div>
      <ul className="flex flex-1 flex-col gap-2">
        {NAV.map(({ path, label, icon: Icon }) => (
          <li key={path}>
            <NavLink
              to={path}
              end={path === '/'}
              title={label}
              aria-label={label}
              className={({ isActive }) =>
                clsx(
                  'flex h-12 w-14 items-center justify-center rounded-xl transition-colors',
                  isActive
                    ? 'bg-white/12 text-white shadow-[inset_3px_0_0_var(--color-gold)]'
                    : 'text-white/60 hover:bg-white/8 hover:text-white',
                )
              }
            >
              <Icon size={21} strokeWidth={1.8} />
            </NavLink>
          </li>
        ))}
      </ul>
      <button onClick={() => setSettingsOpen(true)} className="border-t border-white/10 pt-4" title={`${me.displayName} — settings`}>
        <Avatar member={me} size="md" className="ring-2 ring-white/20" />
      </button>
    </nav>
  );
}

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-white/10 bg-teal-800 py-1.5 md:hidden" aria-label="Main">
      {NAV.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          aria-label={label}
          className={({ isActive }) => clsx('flex h-11 w-11 items-center justify-center rounded-lg', isActive ? 'bg-white/15 text-white' : 'text-white/60')}
        >
          <Icon size={20} strokeWidth={1.8} />
        </NavLink>
      ))}
    </nav>
  );
}
