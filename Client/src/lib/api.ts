const defaultApiBase = process.env.NODE_ENV === "production" 
  ? "https://the-goodfilms.vercel.app" 
  : "http://localhost:8080";

export const API_BASE = process.env.VITE_API_BASE_URL || defaultApiBase;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}