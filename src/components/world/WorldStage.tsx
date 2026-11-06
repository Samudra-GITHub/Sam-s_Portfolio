import { Component, lazy, memo, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import './world.css';

const World = lazy(() => import('./World'));

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class Guard extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The fixed backdrop behind the homepage. The page's text paints first; the
 * 3D world loads once the browser is idle and fades in over a soft drawn
 * fallback, which is also what stays if WebGL is missing or fails.
 */
function WorldStage() {
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onReady = useCallback(() => requestAnimationFrame(() => setReady(true)), []);

  useEffect(() => {
    if (!webglOK()) return;
    const start = () => setMount(true);
    const idle = window.requestIdleCallback?.(start, { timeout: 1500 });
    const t = idle === undefined ? window.setTimeout(start, 400) : undefined;
    return () => {
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (t !== undefined) window.clearTimeout(t);
    };
  }, []);

  return (
    <div className="world" data-ready={ready && !failed} aria-hidden="true">
      <div className="world-fallback">
        <span className="wf-island wf-a" />
        <span className="wf-island wf-b" />
        <span className="wf-orb" />
      </div>
      {mount && !failed && (
        <Guard onFail={() => setFailed(true)}>
          <Suspense fallback={null}>
            <World onReady={onReady} />
          </Suspense>
        </Guard>
      )}
      <div className="world-veil" />
    </div>
  );
}

// memo: page state (the active chapter, the nav) must not re-render the 3D world
export default memo(WorldStage);
