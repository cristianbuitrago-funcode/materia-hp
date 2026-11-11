// Cuántos elementos contaminados y cuántos elementos vivos deben verse
// con una limpieza dada (0 = contaminado, 1 = recuperado).
export function visibleCounts(clean, dirtyTotal, cleanTotal) {
  const v = Math.min(1, Math.max(0, clean));
  return { dirty: Math.round((1 - v) * dirtyTotal), clean: Math.round(v * cleanTotal) };
}
