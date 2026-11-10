export function useSearch(source, fromForm) {
  if (!fromForm) return source;
  const q = new URLSearchParams();
  Object.entries(fromForm).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const has = q.toString();
  return has ? `${source}${source.includes('?') ? '&' : '?'}${has}` : source;
}
