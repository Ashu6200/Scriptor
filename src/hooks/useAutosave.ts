import debounce from "lodash/debounce";
import { useCallback, useEffect, useRef } from "react";

type Debounced<T> = ReturnType<typeof debounce<(content: T) => void>>;

export function useAutosave<T>(saveFn: (content: T) => undefined | Promise<unknown>, delay = 1000) {
  const saveRef = useRef(saveFn);
  const debouncedRef = useRef<Debounced<T> | null>(null);

  useEffect(() => {
    saveRef.current = saveFn;
  }, [saveFn]);

  useEffect(() => {
    const debounced = debounce((content: T) => {
      void saveRef.current(content);
    }, delay);

    debouncedRef.current = debounced;

    return () => {
      debounced.cancel();
      debouncedRef.current = null;
    };
  }, [delay]);

  return useCallback((content: T) => {
    debouncedRef.current?.(content);
  }, []);
}
