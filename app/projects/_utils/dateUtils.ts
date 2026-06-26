// Formats a date to "yyyy-mm-dd" for type="date" inputs
export const toDateInputValue = (
  date: Date | string | null | undefined,
): string => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

// Compact format for displaying a due date (no time).
// Stored at UTC midnight, so it is formatted in UTC to avoid
// off-by-one-day shifts based on the browser's time zone.
export const formatDueDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Calculates the difference in days between now and a given date
export const getDaysSince = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Checks whether a date is recent (less than 3 days ago)
export const isRecentDate = (dateString: string): boolean => {
  return getDaysSince(dateString) <= 3;
};
