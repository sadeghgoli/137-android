export type { HomeMapHandle, HomeMapProps, MapRegion } from './types';

// Fallback for TypeScript / non-web Metro targets.
// On web, Metro resolves to HomeMap.web.tsx instead of this file.
export { HomeMap } from './HomeMap.native';
