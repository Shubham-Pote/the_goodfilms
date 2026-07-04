const defaultApiBase = (typeof window !== "undefined" && window.location.hostname === "localhost") 
  ? "http://localhost:8080" 
  : "https://the-goodfilms.vercel.app";

// Clean the API_BASE by removing any trailing slashes to prevent double-slash URL bugs
let envApiUrl: string | undefined;
try {
  envApiUrl = process.env.VITE_API_BASE_URL;
} catch (e) {
  // process is not defined in browser if not injected
}
export const API_BASE = (envApiUrl || defaultApiBase).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  // Ensure the path always starts with a single slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}