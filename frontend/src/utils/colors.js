const tagClasses = ["tag-1", "tag-2", "tag-3", "tag-4", "tag-5"];

export function tagClassForCategory(category) {
  if (!category) return tagClasses[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagClasses[Math.abs(hash) % tagClasses.length];
}

export function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
}