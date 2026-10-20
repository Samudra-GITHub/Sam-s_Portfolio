import { readStressMode } from '../../data/stress';

/**
 * Dev-only: flips the project data between the real list and break-ui
 * fixtures. Rendered only when import.meta.env.DEV (see App.tsx); the choice
 * lives in the URL, so a reload keeps it. Plain chrome on purpose.
 */
const MODES = [
  { id: '', label: 'Demo data' },
  { id: 'worst', label: 'Worst case' },
  { id: 'empty', label: 'Empty' },
  { id: 'one', label: 'One' },
  { id: 'many', label: '40 more' },
] as const;

export default function DevDataToggle() {
  const current = readStressMode() ?? '';
  const go = (id: string) => {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('data', id);
    else url.searchParams.delete('data');
    window.location.assign(url.toString());
  };
  return (
    <div
      role="group"
      aria-label="Dev data"
      style={{
        position: 'fixed', left: '50%', bottom: 12, transform: 'translateX(-50%)', zIndex: 600,
        display: 'flex', gap: 2, padding: 3, background: '#d4d4d4', borderRadius: 999,
        font: '12px system-ui, sans-serif', color: '#111',
      }}
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={current === m.id}
          onClick={() => go(m.id)}
          style={{ padding: '5px 10px', borderRadius: 999, background: current === m.id ? '#fff' : 'transparent', cursor: 'pointer' }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
