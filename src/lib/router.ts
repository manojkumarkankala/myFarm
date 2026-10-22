import { useEffect, useState, useCallback } from 'react';

export interface RouteState {
  path: string;
  params: Record<string, string>;
}

function parseHash(): RouteState {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  return { path: raw, params: {} };
}

export function useRouter() {
  const [route, setRoute] = useState<RouteState>(() =>
    typeof window !== 'undefined' ? parseHash() : { path: '/', params: {} }
  );

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    if (!window.location.hash) window.location.hash = '/';
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((to: string) => {
    window.location.hash = to;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { route, navigate };
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const pSeg = pattern.split('/').filter(Boolean);
  const aSeg = path.split('/').filter(Boolean);
  if (pSeg.length !== aSeg.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pSeg.length; i++) {
    if (pSeg[i].startsWith(':')) {
      params[pSeg[i].slice(1)] = decodeURIComponent(aSeg[i]);
    } else if (pSeg[i] !== aSeg[i]) {
      return null;
    }
  }
  return params;
}
