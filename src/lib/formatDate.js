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
