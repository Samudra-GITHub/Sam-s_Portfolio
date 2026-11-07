import { useRef } from 'react';
import { StudioPage } from '../studio/StudioShell';
import { useStudioMotion } from '../studio/motion';
import { Contact, Universe } from '../studio/sections';
import '../studio/project.css';

export default function Projects() {
  const root = useRef<HTMLElement>(null);
  useStudioMotion(root);
  return (
    <StudioPage rootRef={root}>
      <header className="st-page__head">
        <h1 className="st-page__title"><span className="st-clip"><span data-line>Index</span></span></h1>
      </header>
      <Universe />
      <Contact />
    </StudioPage>
  );
}
