const defaultApiBase = (typeof window !== "undefined" && window.location.hostname === "localhost") 
  ? "http://localhost:8080" 
  : "https://the-goodfilms.vercel.app";

// Vite requires explicit static string references to import.meta.env during build time
export const API_BASE = import.meta.env.VITE_API_BASE_URL || defaultApiBase;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}