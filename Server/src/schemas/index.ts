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
