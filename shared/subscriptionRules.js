export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(date, days) {
  if (!isDate(date) || !Number.isSafeInteger(days)) return "";
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDate(value);
}

export function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

export function renewalValues(plan, today = localDate()) {
  return {
    startDate: today,
    endDate: plan.duration_days ? addDays(today, plan.duration_days) : null,
    remainingSessions: plan.session_count || null,
  };
}
