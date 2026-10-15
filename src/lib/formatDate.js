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

// Stamp revealed under a message bubble; matches the mobile thread.
export function formatMessageTime(date) {
  return format(new Date(date), "MMM d, h:mm a");
}

// Day separator in the message thread, e.g. "October 13th" (year only when it
// is not the current one).
export function formatMessageDate(date) {
  const d = new Date(date);

  if (isThisYear(d)) {
    return format(d, "MMMM do");
  }

  return format(d, "MMMM do, yyyy");
}
