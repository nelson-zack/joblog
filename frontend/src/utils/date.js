const PAD = (value) => String(value).padStart(2, '0');

const STRICT_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOOSE_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

export const todayYMDLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${PAD(now.getMonth() + 1)}-${PAD(
    now.getDate()
  )}`;
};

export const isValidYMD = (value) => {
  if (typeof value !== 'string') return false;
  const match = value.match(STRICT_REGEX);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const normalizeYMD = (value) => {
  if (!value || typeof value !== 'string') return '';
  const match = value.match(LOOSE_REGEX);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const padded = `${year}-${PAD(month)}-${PAD(day)}`;
  return isValidYMD(padded) ? padded : '';
};

export const parseYMDToUTC = (value) => {
  if (!isValidYMD(value)) return 0;
  const [, year, month, day] = value.match(STRICT_REGEX);
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
};
