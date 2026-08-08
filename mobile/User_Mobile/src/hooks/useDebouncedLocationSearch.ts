import { useEffect, useRef, useState } from 'react';
import { LocationSearchResult, searchLocationsApi } from '../services/locationApiService';

const DEBOUNCE_MS = 300;

export const useDebouncedLocationSearch = (query: string) => {
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentId = ++requestId.current;

    const timer = setTimeout(async () => {
      const found = await searchLocationsApi(trimmed);
      if (requestId.current === currentId) {
        setResults(found);
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
};
