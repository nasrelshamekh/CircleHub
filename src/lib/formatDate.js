import { format, isToday, isThisYear } from "date-fns";

export function formatPostDate(date) {
  const d = new Date(date);

  if (isToday(d)) {
    return `Today at ${format(d, "h:mm a")}`;
  }

  if (isThisYear(d)) {
    return format(d, "MMMM do 'at' h:mm a");
  }

  return format(d, "MMMM do yyyy 'at' h:mm a");
}

// Compact stamp for the conversation list and message bubbles.
export function formatShortTime(date) {
  const d = new Date(date);
  const seconds = (Date.now() - d.getTime()) / 1000;

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return format(d, "MMM d");
}
