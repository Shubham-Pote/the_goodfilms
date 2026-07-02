const defaultApiBase = "http://localhost:8080";

const runtimeEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};

export const API_BASE = runtimeEnv.VITE_API_BASE_URL || defaultApiBase;

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}