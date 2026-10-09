'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

export function useData(source) {
  // `raw` conserva la respuesta completa (p. ej. el `resumen` de los cargos)
  const [state, setState] = useState({
    data: null,
    pagination: null,
    raw: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    mounted.current = true;
    if (!source) {
      setState({ data: null, pagination: null, raw: null, loading: false, error: null });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    api(source)
      .then((res) => {
        if (!mounted.current) return;
        setState({
          data: Array.isArray(res) ? res : res.data,
          pagination: Array.isArray(res) ? null : res.pagination || null,
          raw: res,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!mounted.current) return;
        setState({ data: null, pagination: null, raw: null, loading: false, error: err });
      });
    return () => {
      mounted.current = false;
    };
  }, [source, tick]);

  return { ...state, reload };
}