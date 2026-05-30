import { useCallback, useRef, useEffect } from 'react';
import { InteractionManager } from 'react-native';

/**
 * Debounce hook — prevents rapid-fire API calls (search, scroll)
 */
export function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number = 300): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = useCallback((...args: any[]) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]) as unknown as T;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return debounced;
}

/**
 * Deferred execution — runs callback after animations/transitions
 * complete to avoid UI jank.
 */
export function useAfterInteraction(fn: () => void, deps: any[] = []) {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      fn();
    });
    return () => task.cancel();
  }, deps);
}

// Re-export from standalone hook (no @react-native-community/netinfo dependency)
export { useNetworkStatus } from './useNetworkStatus';

/**
 * Lazy image preloader — preloads images in batches during idle time
 */
export function preloadImages(urls: string[], batchSize: number = 3): void {
  if (typeof Image === 'undefined') return;

  let index = 0;

  function loadBatch() {
    const batch = urls.slice(index, index + batchSize);
    if (batch.length === 0) return;

    batch.forEach((url) => {
      const img = new (globalThis as any).Image();
      img.src = url;
    });

    index += batchSize;

    if (index < urls.length) {
      requestAnimationFrame(loadBatch);
    }
  }

  requestAnimationFrame(loadBatch);
}
