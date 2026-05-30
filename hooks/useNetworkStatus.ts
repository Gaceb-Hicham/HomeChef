import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Lightweight offline detection hook.
 * Uses navigator.onLine on web and a periodic fetch-based check on native.
 * Falls back to "online" if detection isn't available.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: use native browser events
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Native: periodic lightweight check
    let mounted = true;
    const check = async () => {
      try {
        // HEAD request to a reliable endpoint — very small payload
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch('https://www.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (mounted) setIsOnline(true);
      } catch {
        if (mounted) setIsOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 15000); // check every 15s
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return isOnline;
}
