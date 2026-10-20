import { useEffect } from 'react';
import { ScrollTrigger } from '../lib/gsap';
import Universe from '../components/home/Universe';
import Work from '../components/work/Work';
import Gate from '../components/home/Gate';
import Contact from '../components/contact/Contact';

export default function Home() {
  // Layout shifts when webfonts land; pin distances must be measured after.
  useEffect(() => {
    let cancelled = false;
    const refresh = () => !cancelled && ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('load', refresh);
    };
  }, []);

  return (
    <main id="main">
      <Universe />
      <Work />
      <Gate />
      <Contact />
    </main>
  );
}
