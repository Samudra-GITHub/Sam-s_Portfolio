import { useRef } from 'react';
import { StudioPage } from '../studio/StudioShell';
import { useStudioMotion } from '../studio/motion';
import { About, Contact, Experiments, Toolkit } from '../studio/sections';
import '../studio/project.css';

export default function AboutPage() {
  const root = useRef<HTMLElement>(null);
  useStudioMotion(root);
  return (
    <StudioPage rootRef={root}>
      <header className="st-page__head">
        <h1 className="st-page__title"><span className="st-clip"><span data-line>About</span></span></h1>
      </header>
      <About />
      <Toolkit />
      <Experiments />
      <Contact />
    </StudioPage>
  );
}
