export function chisinauDay(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Chisinau" });
}

export function isFutureChisinauDay(date?: Date) {
  if (!date) {
    return false;
  }
  return chisinauDay(date) > chisinauDay();
}
