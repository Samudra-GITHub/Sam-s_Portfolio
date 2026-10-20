import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { scrollToTarget } from './lib/scroll';
import { initPointer } from './lib/pointer';
import { initSoundDelegation } from './lib/sound';
import Cursor from './components/core/Cursor';
import SmoothScroll from './components/core/SmoothScroll';
import { PageTransitionProvider } from './components/core/PageTransition';
import { KageProvider } from './components/kage/Kage';
import Nav from './components/Nav';
import Home from './pages/Home';
import DevDataToggle from './components/core/DevDataToggle';
import NotFound from './pages/NotFound';

// The case-study page is a separate chunk: the home page never pays for it.
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Projects = lazy(() => import('./pages/Projects'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    initPointer();
    initSoundDelegation();
  }, []);

  // every route starts at the top (page transitions then land on their own target)
  useEffect(() => {
    scrollToTarget(0, { immediate: true });
  }, [pathname]);

  return (
    <PageTransitionProvider>
      <KageProvider>
        <SmoothScroll />
        <Cursor />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div id="site">
          <Nav />
          <Suspense fallback={<div style={{ minHeight: '100dvh' }} />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/work/:slug" element={<ProjectDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
        {/* dev-only stress fixtures (break-ui): shown only with ?dev or ?data= so the preview stays clean */}
        {import.meta.env.DEV && /[?&](dev|data)/.test(window.location.search) && <DevDataToggle />}
      </KageProvider>
    </PageTransitionProvider>
  );
}
