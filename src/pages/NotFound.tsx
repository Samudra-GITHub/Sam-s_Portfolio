import { Link } from 'react-router-dom';
import Magnetic from '../components/core/Magnetic';
import { StudioPage } from '../studio/StudioShell';
import '../studio/project.css';

export default function NotFound() {
  return (
    <StudioPage>
      <section className="st-lost" aria-labelledby="st-lost-title">
        <p className="st-meta">Error 404</p>
        <h1 id="st-lost-title" className="st-lost__title">Lost.</h1>
        <p className="st-lead">There is nothing at this address. The work is all on the home page.</p>
        <p>
          <Magnetic>
            <Link className="st-button" to="/">Back to the studio</Link>
          </Magnetic>
        </p>
      </section>
    </StudioPage>
  );
}
