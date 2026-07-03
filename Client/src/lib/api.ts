const defaultApiBase = (typeof window !== "undefined" && window.location.hostname === "localhost") 
  ? "http://localhost:8080" 
  : "https://the-goodfilms.vercel.app";

// The project uses Bun build, not Vite! It replaces process.env directly.
export const API_BASE = process.env.VITE_API_BASE_URL || defaultApiBase;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}