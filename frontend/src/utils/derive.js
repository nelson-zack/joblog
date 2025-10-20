import { parseTags as parseTagsRaw } from './tags';

export const parseTags = (value) => parseTagsRaw(value);

export const countInterviewRounds = (history) => {
  if (!Array.isArray(history)) return 0;
  return history.reduce(
    (sum, entry) => (entry?.status === 'Interviewing' ? sum + 1 : sum),
    0
  );
};
