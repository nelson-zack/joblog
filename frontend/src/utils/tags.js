export const parseTags = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

export const joinTags = (tags) => {
  if (!Array.isArray(tags)) return '';
  const seen = new Set();
  const result = [];
  for (const tag of tags) {
    const trimmed = (tag || '').trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result.join(',');
};
