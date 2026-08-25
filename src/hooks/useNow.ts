import { useEffect, useState } from 'react';

/** Re-renders the caller roughly once a minute, so relative times ("2h ago") stay fresh. */
export function useNow(intervalMs = 60000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
