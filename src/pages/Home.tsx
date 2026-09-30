import { useEffect } from 'react';
import { ScrollTrigger } from '../lib/gsap';
import Hero from '../components/hero/Hero';
import Work from '../components/work/Work';
import Lab from '../components/lab/Lab';
import About from '../components/about/About';
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
      <Hero />
      <Work />
      <Lab />
      <About />
      <Contact />
    </main>
  );
}
