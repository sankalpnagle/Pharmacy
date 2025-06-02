export function formatDate(isoDate: string) {
  const date = new Date(isoDate);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getUTCDay()];
  const day = date.getUTCDate().toString().padStart(2, "0");
  const monthName = months[date.getUTCMonth()];
  const monthNumber = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = date.getUTCFullYear();

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");

  const getOrdinal = (n: number) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const longFormat = `${dayName}, ${parseInt(day)}${getOrdinal(
    parseInt(day)
  )} ${monthName} ${year} - ${hour12}:${paddedMinutes} ${ampm}`;
  const shortFormat = `${day}/${monthNumber}/${year}`;

  return {
    longFormat,
    shortFormat,
  };
}
