import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { scrollToTarget } from './lib/scroll';
import { initPointer } from './lib/pointer';
import Cursor from './components/core/Cursor';
import Loader from './components/core/Loader';
import SmoothScroll from './components/core/SmoothScroll';
import { PageTransitionProvider } from './components/core/PageTransition';
import { KageProvider } from './components/kage/Kage';
import Nav from './components/Nav';
import SideIndex from './components/SideIndex';
import Companion from './components/companion/Companion';
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// The case-study page is a separate chunk: the home page never pays for it.
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    initPointer();
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
        <Loader />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div id="site">
          <Nav />
          <SideIndex />
          <Companion />
          <Suspense fallback={<div style={{ minHeight: '100dvh' }} />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/work/:slug" element={<ProjectDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </KageProvider>
    </PageTransitionProvider>
  );
}
