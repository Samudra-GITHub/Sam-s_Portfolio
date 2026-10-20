import { useMemo, useState, type CSSProperties } from 'react';
import { paged, type Project } from '../../data/projects';
import './stack.css';

/**
 * The Toolbox, organised: every tool in any project's `tech` list, filed
 * into a few honest groups and ordered by how many projects use it. Next to
 * each tool sits one enamel disc per project that uses it, so the "how much"
 * is the real list of projects, not a skill bar.
 *
 * It works both ways: point at a tool and its projects light up in the
 * legend; point at a project and the tools it was built with light up in the
 * groups. Nothing is typed in by hand, so it only ever shows what the work used.
 */
const GROUPS: { id: string; title: string; note: string; tools: string[] }[] = [
  { id: 'lang', title: 'Languages', note: 'what the code is written in', tools: ['TypeScript', 'Python', 'C++', 'HTML', 'CSS', 'LaTeX'] },
  { id: 'ui', title: 'Interface', note: 'frameworks and state', tools: ['React', 'Next.js', 'Tailwind CSS', 'Vite', 'Zustand', 'Recharts'] },
  { id: 'motion', title: 'Motion & 3D', note: 'how things move', tools: ['Framer Motion', 'GSAP', 'Lenis', 'Three.js', 'React Three Fiber', 'WebGL'] },
  { id: 'back', title: 'Backend & data', note: 'servers, storage, services', tools: ['FastAPI', 'Flask', 'Prisma', 'PostgreSQL', 'Supabase', 'Stripe', 'Docker', 'OpenWeatherMap API'] },
  { id: 'ai', title: 'AI & vision', note: 'models and the maths around them', tools: ['PyTorch', 'NumPy', 'scikit-image', 'Matplotlib', 'faster-whisper', 'Llama 3.3 (Groq)', 'Groq', 'edge-tts'] },
  { id: 'hw', title: 'Hardware', note: 'boards and firmware', tools: ['ESP32', 'Arduino'] },
];

interface Tool {
  name: string;
  by: Project[];
}

function useGroups() {
  return useMemo(() => {
    const tally = new Map<string, Tool>();
    for (const p of paged) for (const name of p.tech) {
      const t = tally.get(name) ?? { name, by: [] };
      t.by.push(p);
      tally.set(name, t);
    }
    const filed = new Set<string>();
    const sort = (a: Tool, b: Tool) => b.by.length - a.by.length || a.name.localeCompare(b.name);
    const groups = GROUPS.map((g) => {
      const tools = g.tools.map((n) => tally.get(n)).filter((t): t is Tool => Boolean(t)).sort(sort);
      tools.forEach((t) => filed.add(t.name));
      return { ...g, tools };
    });
    // anything a project lists that no group names still shows up, never silently dropped
    const rest = [...tally.values()].filter((t) => !filed.has(t.name)).sort(sort);
    if (rest.length) groups.push({ id: 'other', title: 'Other', note: 'everything else', tools: rest });
    return { groups: groups.filter((g) => g.tools.length > 0), total: tally.size };
  }, []);
}

/** three type sizes, from how widely a tool is used */
const tier = (n: number) => (n >= 5 ? 1 : n >= 2 ? 2 : 3);

export default function Stack() {
  const { groups, total } = useGroups();
  const [tool, setTool] = useState<string | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [pinned, setPinned] = useState<{ kind: 'tool' | 'project'; id: string } | null>(null);

  const activeTool = tool ?? (pinned?.kind === 'tool' ? pinned.id : null);
  const activeProject = project ?? (pinned?.kind === 'project' ? pinned.id : null);
  const toolObj = activeTool ? groups.flatMap((g) => g.tools).find((t) => t.name === activeTool) : null;
  const projObj = activeProject ? paged.find((p) => p.id === activeProject) : null;

  const toolOn = (t: Tool) => (projObj ? projObj.tech.includes(t.name) : activeTool ? t.name === activeTool : true);
  const projOn = (p: Project) => (toolObj ? toolObj.by.some((q) => q.id === p.id) : activeProject ? p.id === activeProject : true);
  const filtering = Boolean(toolObj || projObj);
  const pin = (kind: 'tool' | 'project', id: string) => setPinned((cur) => (cur?.kind === kind && cur.id === id ? null : { kind, id }));

  const readout = toolObj
    ? `${toolObj.name} · used in ${toolObj.by.length} ${toolObj.by.length === 1 ? 'project' : 'projects'}`
    : projObj
      ? `${projObj.title} · built with ${projObj.tech.length} ${projObj.tech.length === 1 ? 'tool' : 'tools'}`
      : 'Point at a tool to see its projects, or at a project to see its tools.';

  if (total === 0) {
    return (
      <section id="stack" className="stack" aria-labelledby="stack-title">
        <div className="stack-inner">
          <h2 id="stack-title" className="stack-title">Toolbox</h2>
          <p className="stack-empty">No tools listed yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="stack" className="stack" aria-labelledby="stack-title" data-filtering={filtering || undefined}>
      <div className="stack-inner">
        <header className="stack-head">
          <h2 id="stack-title" className="stack-title">Toolbox</h2>
          <p className="stack-sub">
            {total} tools across {paged.length} projects, filed by what they do. Each disc is a project that uses the tool.
          </p>
        </header>

        <div className="stack-groups">
          {groups.map((g) => (
            <section key={g.id} className="stack-group" aria-labelledby={`sg-${g.id}`}>
              <header className="stack-group-head">
                <h3 id={`sg-${g.id}`} className="stack-group-title">{g.title}</h3>
                <span className="mono stack-group-n">{String(g.tools.length).padStart(2, '0')}</span>
              </header>
              <p className="stack-group-note">{g.note}</p>
              <ul className="stack-tools">
                {g.tools.map((t) => (
                  <li key={t.name}>
                    <button
                      type="button"
                      className="stack-tool"
                      data-tier={tier(t.by.length)}
                      data-on={toolOn(t)}
                      aria-pressed={pinned?.kind === 'tool' && pinned.id === t.name}
                      onClick={() => pin('tool', t.name)}
                      onPointerEnter={(e) => e.pointerType === 'mouse' && setTool(t.name)}
                      onPointerLeave={() => setTool(null)}
                      onFocus={() => setTool(t.name)}
                      onBlur={() => setTool(null)}
                    >
                      <span className="stack-tool-name">{t.name}</span>
                      <span className="stack-tool-discs" aria-hidden="true">
                        {t.by.map((p) => (
                          <i key={p.id} style={{ '--d': p.palette.bg } as CSSProperties} data-on={!projObj || projObj.id === p.id} />
                        ))}
                      </span>
                      <span className="sr-only">, used in {t.by.map((p) => p.title).join(', ')}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="stack-legend">
          <p className="mono stack-readout" aria-live="polite">{readout}</p>
          <ul className="stack-projects" aria-label="Projects">
            {paged.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="stack-project"
                  data-on={projOn(p)}
                  aria-pressed={pinned?.kind === 'project' && pinned.id === p.id}
                  onClick={() => pin('project', p.id)}
                  onPointerEnter={(e) => e.pointerType === 'mouse' && setProject(p.id)}
                  onPointerLeave={() => setProject(null)}
                  onFocus={() => setProject(p.id)}
                  onBlur={() => setProject(null)}
                  style={{ '--d': p.palette.bg } as CSSProperties}
                >
                  <span className="stack-project-disc" aria-hidden="true" />
                  {p.title}
                </button>
              </li>
            ))}
          </ul>
          {pinned && (
            <button type="button" className="tlink stack-clear" onClick={() => setPinned(null)}>
              Clear selection
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
