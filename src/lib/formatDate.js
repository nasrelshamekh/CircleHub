import { format, formatDistanceToNow, isToday, isThisYear } from "date-fns";

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

export function formatShortTime(date) {
  const d = new Date(date);
  const seconds = (Date.now() - d.getTime()) / 1000;

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return format(d, "MMM d");
}

// Presence wording, deliberately not formatShortTime: "12m" already means "when this message was sent"
// in this UI, and the offline case has to say that the time is when the person was last around.
export function formatLastSeen(date) {
  const d = new Date(date);

  // date-fns has no short form for this window; "less than a minute ago" reads badly under a name.
  if (Date.now() - d.getTime() < 60_000) {
    return "Last seen just now";
  }

  return `Last seen ${formatDistanceToNow(d, { addSuffix: true })}`;
}

export function formatMessageTime(date) {
  return format(new Date(date), "MMM d, h:mm a");
}

export function formatMessageDate(date) {
  const d = new Date(date);

  if (isThisYear(d)) {
    return format(d, "MMMM do");
  }

  return format(d, "MMMM do, yyyy");
}
