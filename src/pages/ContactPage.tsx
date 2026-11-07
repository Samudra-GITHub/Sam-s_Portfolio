import { useRef } from 'react';
import { StudioPage } from '../studio/StudioShell';
import { useStudioMotion } from '../studio/motion';
import { Contact } from '../studio/sections';
import '../studio/project.css';

export default function ContactPage() {
  const root = useRef<HTMLElement>(null);
  useStudioMotion(root);
  return (
    <StudioPage rootRef={root} tone="dark" className="st-page--contact">
      <Contact />
    </StudioPage>
  );
}
