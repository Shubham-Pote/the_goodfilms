/**
 * Centralized TMDB API configuration.
 * Bun auto-loads .env and replaces process.env.BUN_PUBLIC_TMDB_API_KEY at build time.
 * The build.ts `define` option handles production builds.
 * In dev mode with HMR, Bun also replaces process.env references.
 */

export const TMDB_API_KEY: string = process.env.BUN_PUBLIC_TMDB_API_KEY ?? "";

const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * Build a full TMDB API URL.
 * @param path  e.g. "/trending/all/day" or "/search/multi"
 * @param params  extra query params (api_key is auto-appended)
 */
export function tmdbUrl(path: string, params?: Record<string, string>): string {
  const separator = path.includes("?") ? "&" : "?";
  const extra = params
    ? "&" +
      Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&")
    : "";
  return `${TMDB_BASE}${path}${separator}api_key=${TMDB_API_KEY}${extra}`;
}

export const TMDB_IMG = "https://image.tmdb.org/t/p";
