const threads = ["var(--thread-1)", "var(--thread-2)", "var(--thread-3)", "var(--thread-4)", "var(--thread-5)"];

export function threadColor(category) {
  if (!category) return threads[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return threads[Math.abs(hash) % threads.length];
}