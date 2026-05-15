import { formatDate, parseLocalDate } from './format';

export function isToday(dateStr: string): boolean {
  const date = parseLocalDate(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export function getRelativeDateLabel(dateStr: string): string {
  if (isToday(dateStr)) return 'Today';
  return formatDate(dateStr);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
