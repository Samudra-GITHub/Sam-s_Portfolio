import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { WorldId } from '../../../data/projects';

/** Each world is its own chunk, fetched only when its chapter is near. */
export const WORLDS: Record<WorldId, LazyExoticComponent<ComponentType>> = {
  tarang: lazy(() => import('./TarangWorld')),
  rinti: lazy(() => import('./RintiWorld')),
  akasha: lazy(() => import('./AkashaWorld')),
  skycast: lazy(() => import('./SkycastWorld')),
  krama: lazy(() => import('./KramaWorld')),
  grama: lazy(() => import('./GramaWorld')),
  portfolio: lazy(() => import('./PortfolioWorld')),
};
