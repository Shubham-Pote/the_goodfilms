import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  gender: z.enum(["Male", "Female"]),
  profilePicture: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const progressSchema = z.object({
  contentId: z.union([z.string(), z.number()]).transform(String), // TMDB sends numbers, we store as strings
  contentType: z.enum(["movie", "tv", "anime"]),
  progress: z.number().min(0).max(100),
  timestamp: z.number().optional(),
  duration: z.number().optional(),
  season: z.number().optional(),
  episode: z.number().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProgressInput = z.infer<typeof progressSchema>;

export const liveEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  thumbnail: z.string().optional(),
  status: z.enum(["UPCOMING", "LIVE", "ENDED"]).default("UPCOMING"),
});

export const liveStreamSchema = z.object({
  name: z.string().min(1, "Stream name is required"),
  streamUrl: z.string().url("Must be a valid URL"),
  streamType: z.enum(["DASH", "HLS"]),
  drmScheme: z.string().optional(),
  drmKeyId: z.string().optional(),
  drmKey: z.string().optional(),
  licenseUrl: z.string().optional(),
  referer: z.string().optional(),
  cookie: z.string().optional(),
  origin: z.string().optional(),
  userAgent: z.string().optional(),
});

export type LiveEventInput = z.infer<typeof liveEventSchema>;
export type LiveStreamInput = z.infer<typeof liveStreamSchema>;
