import { useEffect, useState } from 'react';
import { localDateKey } from '../domain/dates';
import type { DateKey } from '../domain/types';

/**
 * Bugünün yerel gün anahtarı; uygulama ön plana dönünce ve dakikada bir yenilenir.
 * iOS ana ekran uygulamaları günlerce askıda kalıp kaldığı yerden açılabildiği için
 * "bugün" bir kez hesaplanıp saklanamaz.
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => localDateKey(new Date()));
  useEffect(() => {
    const refresh = () => setToday(localDateKey(new Date()));
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
      window.clearInterval(timer);
    };
  }, []);
  return today;
}
