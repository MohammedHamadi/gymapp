export function localDate(date?: Date): string;
export function addDays(date: string, days: number): string;
export function isDate(value: unknown): boolean;
export function renewalValues(plan: any, today?: string): {
  startDate: string;
  endDate: string | null;
  remainingSessions: number | null;
};
