export function formatTime(date: Date) {
  return date.toLocaleTimeString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo"
  });
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatVisitPurpose(purpose: string) {
  if (purpose === "first") {
    return "初診";
  }
  if (purpose === "followup") {
    return "再診";
  }
  return purpose;
}
