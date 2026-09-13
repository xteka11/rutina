import { MONTHS } from '../core/default-routine';

export const fmtDate = (s: string): string => {
  const p = String(s).split('-');
  return `${+p[2]} ${MONTHS[+p[1] - 1]}`;
};
export const fmtKg = (n: number): string => (n >= 1000 ? Math.round(n / 1000) + 't' : String(Math.round(n)));
export const pad = (n: number): string => String(n).padStart(2, '0');
