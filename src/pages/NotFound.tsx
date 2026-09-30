import { usePageTransition } from '../components/core/PageTransition';
import ProximityText from '../components/core/ProximityText';
import Magnetic from '../components/core/Magnetic';
import './notfound.css';

export default function NotFound() {
  const { go } = usePageTransition();
  return (
    <main id="main" className="nf">
      <div className="nf-inner">
        <p className="mono">Error 404</p>
        <h1 className="nf-title font-display">
          <ProximityText text="LOST" intro introDelay={0.15} radius={260} />
        </h1>
        <p className="nf-line">This world does not exist. Maybe it is still being built.</p>
        <Magnetic>
          <a
            href="/"
            className="btn"
            onClick={(e) => {
              e.preventDefault();
              go('/', { label: 'Home', color: '#d8f827', ink: '#111215' });
            }}
          >
            Take me back
          </a>
        </Magnetic>
      </div>
    </main>
  );
}
